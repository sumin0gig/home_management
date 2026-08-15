import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFamilyStore } from '../../store/useFamilyStore';
import FamilyOnboarding from './components/FamilyOnboarding';
import FamilyHome from './components/FamilyHome';

function FamilyScreen(): React.JSX.Element {
  const status = useFamilyStore(state => state.status);
  const fetchMyFamily = useFamilyStore(state => state.fetchMyFamily);

  React.useEffect(() => {
    fetchMyFamily();
  }, [fetchMyFamily]);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return status === 'joined' ? <FamilyHome /> : <FamilyOnboarding />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FamilyScreen;
