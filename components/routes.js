import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, StackNavigator, TabNavigator } from 'react-navigation';

import Dashboard from './dashboard';
import Signin from './signin';
import Settings from './settings';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBarStyle: {
    backgroundColor: '#dbdbdb'
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    justifyContent: 'center'
  },
  selected: {
    color: 'blue'
  }
});

const TabIcon = ({ title, selected }) => (
  <View style={styles.container}>
    <Text style={[styles.tabText, selected ? styles.selected : undefined]}>
      {title}
    </Text>
  </View>
);
TabIcon.propTypes = {
  selected: PropTypes.bool,
  title: PropTypes.string.isRequired
};

const MainScreenNavigator = TabNavigator({
  Dashboard: { screen: Dashboard },
  Settings: { screen: Settings }
});

export const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Signin: { screen: Signin }
}, {
  mode: 'modal'
});

const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(firstAction);
const initialNavState = AppNavigator.router.getStateForAction(
  tempNavState
);

export const navigationReducer = (state = initialNavState, action) => {
  let nextState;
  switch (action.type) {
    default:
      nextState = AppNavigator.router.getStateForAction(action, state);
      break;
  }

  // Simply return the original `state` if `nextState` is null or undefined.
  return nextState || state;
};

const AppWithNavigationState = ({ dispatch, nav = '' }) => (
  <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />
);

AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  nav: state.nav
});

export default connect(mapStateToProps)(AppWithNavigationState);
