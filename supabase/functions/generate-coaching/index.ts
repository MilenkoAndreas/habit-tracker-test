import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callClaude(prompt: string, maxTokens = 200): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()
  return data.content[0].text as string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Return today's cached coaching if it exists
    const { data: cached, count: generatedToday } = await supabase
      .from('ai_insights')
      .select('content', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'coaching')
      .gte('generated_at', todayStart.toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached) {
      return new Response(JSON.stringify({ insight: cached.content, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: max 5 AI generations per user per day across all types
    const { count: dailyCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('generated_at', todayStart.toISOString())

    if ((dailyCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'Daily limit reached. Try again tomorrow.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch habits and completions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    const [habitsRes, completionsRes] = await Promise.all([
      supabase.from('habits').select('id, name, emoji, type, target_count').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('completions').select('habit_id, date').eq('user_id', user.id).gte('date', startDate),
    ])

    const habits = habitsRes.data ?? []
    const completions = completionsRes.data ?? []

    if (habits.length === 0) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Per-habit stats
    const today = new Date()
    const habitStats = habits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id)
      const completedDates = new Set(habitCompletions.map(c => c.date))
      const daysCompleted = completedDates.size
      const consistencyPct = Math.round((daysCompleted / 30) * 100)

      let streak = 0
      for (let i = 0; i < 30; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const count = habitCompletions.filter(c => c.date === dateStr).length
        if (count >= habit.target_count) streak++
        else if (i > 0) break
      }

      return { name: habit.name, emoji: habit.emoji, streak, consistencyPct }
    })

    const sorted = [...habitStats].sort((a, b) => b.consistencyPct - a.consistencyPct)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    const hasGap = best.consistencyPct - worst.consistencyPct > 20

    const prompt = `You are a warm, encouraging personal habit coach. Write ONE personalized coaching nudge for this user. Be specific, not generic.

Habits (last 30 days):
${habitStats.map(h => `• ${h.emoji} ${h.name}: ${h.streak}-day streak, ${h.consistencyPct}% consistency`).join('\n')}

Best performing: ${best.emoji} ${best.name} (${best.consistencyPct}%)
Needs attention: ${worst.emoji} ${worst.name} (${worst.consistencyPct}%)
Notable gap: ${hasGap ? 'yes' : 'no'}

Rules:
- 2-3 sentences max
- Celebrate specific wins by name
- If there's a notable gap, give one concrete, practical tip for the weakest habit
- Flowing prose only — no bullet points, no headers`

    const content = await callClaude(prompt, 200)

    await supabase.from('ai_insights').insert({ user_id: user.id, type: 'coaching', content })

    return new Response(JSON.stringify({ insight: content, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-coaching error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
