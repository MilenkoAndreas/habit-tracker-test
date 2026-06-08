import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callClaude(prompt: string, maxTokens = 350): Promise<string> {
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

function getWeekBounds(): { start: string; end: string } {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return {
    start: monday.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  }
}

function getMonthBounds(): { start: string; end: string } {
  const today = new Date()
  return {
    start: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
    end: today.toISOString().split('T')[0],
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const type: 'weekly' | 'monthly' = body.type === 'monthly' ? 'monthly' : 'weekly'

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

    const bounds = type === 'weekly' ? getWeekBounds() : getMonthBounds()

    // Return cached reflection for this period if it exists
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('content')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('period_start', bounds.start)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached) {
      return new Response(JSON.stringify({ insight: cached.content, cached: true, period: bounds }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: max 5 AI generations per user per day across all types
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
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

    const [habitsRes, completionsRes] = await Promise.all([
      supabase.from('habits').select('id, name, emoji, type, target_count').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('completions').select('habit_id, date').eq('user_id', user.id).gte('date', bounds.start).lte('date', bounds.end),
    ])

    const habits = habitsRes.data ?? []
    const completions = completionsRes.data ?? []

    if (habits.length === 0) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const startD = new Date(bounds.start + 'T12:00:00Z')
    const endD = new Date(bounds.end + 'T12:00:00Z')
    const totalDays = Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1

    const habitStats = habits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id)
      const completedDates = new Set(habitCompletions.map(c => c.date))
      const daysCompleted = completedDates.size
      const consistencyPct = Math.round((daysCompleted / totalDays) * 100)
      return { name: habit.name, emoji: habit.emoji, daysCompleted, totalDays, consistencyPct }
    })

    const sorted = [...habitStats].sort((a, b) => b.consistencyPct - a.consistencyPct)

    const periodName = type === 'weekly'
      ? `week of ${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : startD.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const prompt = `You are a personal habit coach. Write a ${type} reflection summary for the ${periodName}.

Habit performance (${totalDays} days tracked):
${habitStats.map(h => `• ${h.emoji} ${h.name}: ${h.daysCompleted}/${h.totalDays} days — ${h.consistencyPct}%`).join('\n')}

Strongest: ${sorted[0].emoji} ${sorted[0].name} (${sorted[0].consistencyPct}%)
Weakest: ${sorted[sorted.length - 1].emoji} ${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].consistencyPct}%)

Write 3-4 sentences:
1. What went well — be specific with names and numbers
2. Where momentum dropped and a possible reason
3. One concrete focus for the next ${type === 'weekly' ? 'week' : 'month'}
Warm, honest, analytical tone. Flowing prose — no bullets or headers.`

    const content = await callClaude(prompt, 350)

    await supabase.from('ai_insights').insert({
      user_id: user.id,
      type,
      content,
      period_start: bounds.start,
      period_end: bounds.end,
    })

    return new Response(JSON.stringify({ insight: content, cached: false, period: bounds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-reflection error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
