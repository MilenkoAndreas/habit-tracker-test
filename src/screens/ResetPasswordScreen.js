import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../AuthContext';
import { useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error: authError } = await updatePassword(password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[s.gradient, { backgroundColor: colors.primary }]}>
        <SafeAreaView style={s.safe}>
          <View style={s.centerWrap}>
            <Text style={s.bigIcon}>✅</Text>
            <Text style={s.doneTitle}>Password updated!</Text>
            <Text style={s.doneBody}>You're all set. The app will continue automatically.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              <Text style={s.icon}>🔑</Text>
              <Text style={s.title}>New Password</Text>
              <Text style={s.tagline}>Choose a strong password</Text>
            </View>

            <View style={s.card}>
              <Text style={s.label}>New Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoFocus
              />

              <Text style={s.label}>Confirm Password</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.primary} />
                  : <Text style={s.btnText}>Set New Password</Text>
                }
              </TouchableOpacity>
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
    centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
    bigIcon: { fontSize: 72, marginBottom: SPACING.lg },
    doneTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: SPACING.md },
    doneBody: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  });
}
