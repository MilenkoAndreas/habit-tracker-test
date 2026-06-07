import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../AuthContext';
import { useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';

function friendlyError(msg) {
  if (!msg) return '';
  if (msg.includes('rate limit') || msg.includes('after')) return 'Too many attempts. Please wait a moment and try again.';
  if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) return 'Email or password is incorrect.';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  if (msg.includes('weak') || msg.includes('password')) return 'Please choose a stronger password.';
  if (msg.includes('Token has expired') || msg.includes('otp_expired')) return 'That code has expired. Please request a new one.';
  if (msg.includes('Invalid') && msg.includes('token')) return 'That code is incorrect. Please check and try again.';
  return msg;
}

export default function AuthScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const { signIn, signUp, sendResetCode, verifyResetCode } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setConfirm('');
    setCode('');
    setAwaitingConfirmation(false);
    setCodeSent(false);
  };

  const handleSubmit = async () => {
    setError('');

    // Forgot step 2: verify the code
    if (mode === 'forgot' && codeSent) {
      if (!code.trim()) { setError('Please enter the code from your email.'); return; }
      setLoading(true);
      const { error: authError } = await verifyResetCode(email.trim(), code.trim());
      setLoading(false);
      if (authError) setError(friendlyError(authError.message));
      // On success, needsPasswordReset becomes true in AuthContext →
      // RootNavigator switches to ResetPasswordScreen automatically.
      return;
    }

    // Forgot step 1: send the code
    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email address.'); return; }
      setLoading(true);
      const { error: authError } = await sendResetCode(email.trim());
      setLoading(false);
      if (authError) { setError(friendlyError(authError.message)); return; }
      setCodeSent(true);
      return;
    }

    // Sign in / sign up
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    if (mode === 'signin') {
      const { error: authError } = await signIn(email.trim(), password);
      setLoading(false);
      if (authError) setError(friendlyError(authError.message));
    } else {
      const { error: authError, needsConfirmation } = await signUp(email.trim(), password);
      setLoading(false);
      if (authError) { setError(friendlyError(authError.message)); return; }
      if (needsConfirmation) setAwaitingConfirmation(true);
    }
  };

  // Email confirmation waiting state
  if (awaitingConfirmation) {
    return (
      <View style={[s.gradient, { backgroundColor: colors.primary }]}>
        <SafeAreaView style={s.safe}>
          <View style={s.confirmWrap}>
            <Text style={s.confirmIcon}>📬</Text>
            <Text style={s.confirmTitle}>Check your email</Text>
            <Text style={s.confirmBody}>
              We sent a confirmation link to{'\n'}
              <Text style={s.confirmEmail}>{email}</Text>
              {'\n\n'}Tap the link in that email to activate your account, then come back and sign in.
            </Text>
            <TouchableOpacity style={s.confirmBtn} onPress={() => switchMode('signin')}>
              <Text style={s.confirmBtnText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const buttonLabel = () => {
    if (mode === 'forgot') return codeSent ? 'Verify Code' : 'Send Code';
    return mode === 'signin' ? 'Sign In' : 'Create Account';
  };

  return (
    <View style={[s.gradient, { backgroundColor: colors.primary }]}>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.hero}>
              <Text style={s.icon}>🚀</Text>
              <Text style={s.title}>Antigravity</Text>
              <Text style={s.tagline}>Your daily habit tracker</Text>
            </View>

            <View style={s.card}>
              {mode !== 'forgot' && (
                <View style={s.toggle}>
                  <TouchableOpacity
                    style={[s.toggleBtn, mode === 'signin' && s.toggleBtnActive]}
                    onPress={() => switchMode('signin')}
                  >
                    <Text style={[s.toggleText, mode === 'signin' && s.toggleTextActive]}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.toggleBtn, mode === 'signup' && s.toggleBtnActive]}
                    onPress={() => switchMode('signup')}
                  >
                    <Text style={[s.toggleText, mode === 'signup' && s.toggleTextActive]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Forgot step 1: email entry */}
              {mode === 'forgot' && !codeSent && (
                <>
                  <Text style={s.forgotTitle}>Reset your password</Text>
                  <Text style={s.label}>Email</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </>
              )}

              {/* Forgot step 2: code entry */}
              {mode === 'forgot' && codeSent && (
                <>
                  <Text style={s.forgotTitle}>Enter your code</Text>
                  <Text style={s.forgotSub}>
                    We sent a one-time code to{'\n'}
                    <Text style={s.forgotEmail}>{email}</Text>
                  </Text>
                  <Text style={s.label}>Code</Text>
                  <TextInput
                    style={[s.input, s.codeInput]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus
                  />
                </>
              )}

              {/* Sign in / sign up fields */}
              {mode !== 'forgot' && (
                <>
                  <Text style={s.label}>Email</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={s.label}>Password</Text>
                  <TextInput
                    style={s.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                  {mode === 'signup' && (
                    <>
                      <Text style={s.label}>Confirm Password</Text>
                      <TextInput
                        style={s.input}
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Repeat your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                      />
                    </>
                  )}
                </>
              )}

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.primary} />
                  : <Text style={s.btnText}>{buttonLabel()}</Text>
                }
              </TouchableOpacity>

              {mode === 'signin' && (
                <>
                  <Text style={s.hint}>
                    New here?{' '}
                    <Text style={s.hintLink} onPress={() => switchMode('signup')}>Create a free account</Text>
                  </Text>
                  <Text style={s.hint}>
                    <Text style={s.hintLink} onPress={() => switchMode('forgot')}>Forgot your password?</Text>
                  </Text>
                </>
              )}
              {mode === 'signup' && (
                <Text style={s.hint}>
                  Already have one?{' '}
                  <Text style={s.hintLink} onPress={() => switchMode('signin')}>Sign in</Text>
                </Text>
              )}
              {mode === 'forgot' && !codeSent && (
                <Text style={s.hint}>
                  <Text style={s.hintLink} onPress={() => switchMode('signin')}>Back to Sign In</Text>
                </Text>
              )}
              {mode === 'forgot' && codeSent && (
                <Text style={s.hint}>
                  Didn't get it?{' '}
                  <Text style={s.hintLink} onPress={() => { setCodeSent(false); setCode(''); setError(''); }}>Send again</Text>
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    gradient: { flex: 1 },
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    hero: { alignItems: 'center', paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
    icon: { fontSize: 72, marginBottom: SPACING.sm },
    title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    tagline: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      gap: SPACING.xs,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: RADIUS.md,
      padding: 4,
      marginBottom: SPACING.md,
    },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    toggleText: { fontWeight: '600', color: colors.textSecondary, fontSize: 14 },
    toggleTextActive: { color: colors.text },
    forgotTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
    forgotSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: SPACING.xs },
    forgotEmail: { fontWeight: '600', color: colors.text },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: SPACING.xs },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.background,
    },
    codeInput: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 8,
    },
    error: {
      color: '#EF4444',
      fontSize: 13,
      fontWeight: '500',
      marginTop: SPACING.xs,
      textAlign: 'center',
    },
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: RADIUS.full,
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    hint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
    hintLink: { color: colors.primary, fontWeight: '600' },
    confirmWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
    confirmIcon: { fontSize: 72, marginBottom: SPACING.lg },
    confirmTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: SPACING.md },
    confirmBody: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
    confirmEmail: { fontWeight: '700', color: '#fff' },
    confirmBtn: {
      marginTop: SPACING.xl,
      backgroundColor: colors.card,
      paddingVertical: 14,
      paddingHorizontal: SPACING.xl,
      borderRadius: RADIUS.full,
    },
    confirmBtnText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  });
}
