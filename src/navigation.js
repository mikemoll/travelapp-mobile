import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { addNavigationHelpers, StackNavigator, TabNavigator, NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { map } from 'lodash';
import { REHYDRATE } from 'redux-persist/constants';

import Trips from './screens/trips.screen';
import Messages from './screens/messages.screen';
import FinalizeTrip from './screens/finalize-trip.screen';
import TripDetails from './screens/trip-details.screen';
import NewTrip from './screens/new-trip.screen';
import Signin from './screens/signin.screen';
import Settings from './screens/settings.screen';

import { USER_QUERY } from './graphql/user.query';
import MESSAGE_ADDED_SUBSCRIPTION from './graphql/message-added.subscription';
import TRIP_ADDED_SUBSCRIPTION from './graphql/trip-added.subscription';

// helper function checks for duplicate documents
// TODO: it's pretty inefficient to scan all the documents every time.
// maybe only scan the first 10, or up to a certain timestamp
function isDuplicateDocument(newDocument, existingDocuments) {
  return newDocument.id !== null && existingDocuments.some(doc => newDocument.id === doc.id);
}

// tabs in main screen
const MainScreenNavigator = TabNavigator({
  Chats: { screen: Trips },
  Settings: { screen: Settings }
});

const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Signin: { screen: Signin },
  Messages: { screen: Messages },
  TripDetails: { screen: TripDetails },
  NewTrip: { screen: NewTrip },
  FinalizeTrip: { screen: FinalizeTrip },
}, {
  mode: 'modal'
});

// reducer initialization code
const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(firstAction);
const initialNavState = AppNavigator.router.getStateForAction(
  tempNavState
);

// reducer code
export const navigationReducer = (state = initialNavState, action) => {
  let nextState;
  switch (action.type) {
    case REHYDRATE:
      // convert persisted data to Immutable and confirm rehydration
      if (!action.payload.auth || !action.payload.auth.jwt) {
        const { routes, index } = state;
        if (routes[index].routeName !== 'Signin') {
          nextState = AppNavigator.router.getStateForAction(
            NavigationActions.navigate({ routeName: 'Signin' }),
            state,
          );
        }
      }
      break;
    case 'LOGOUT':
      const { routes, index } = state;
      if (routes[index].routeName !== 'Signin') {
        nextState = AppNavigator.router.getStateForAction(
          NavigationActions.navigate({ routeName: 'Signin' }),
          state,
        );
      }
      break;
    default:
      nextState = AppNavigator.router.getStateForAction(action, state);
      break;
  }

  // Simply return the original `state` if `nextState` is null or undefined.
  return nextState || state;
};

class AppWithNavigationState extends Component {
  componentWillReceiveProps(nextProps) {
    if (!nextProps.user) {
      if (this.tripSubscription) {
        this.tripSubscription();
      }

      if (this.messagesSubscription) {
        this.messagesSubscription();
      }
    }

    if (nextProps.user &&
      (!this.props.user || nextProps.user.trips.length !== this.props.user.trips.length)) {
      // unsubscribe from old

      if (typeof this.messagesSubscription === 'function') {
        this.messagesSubscription();
      }
      // subscribe to new
      if (nextProps.user.trips.length) {
        this.messagesSubscription = nextProps.subscribeToMessages();
      }
    }

    if (!this.tripSubscription && nextProps.user) {
      this.tripSubscription = nextProps.subscribeToTrips();
    }
  }

  render() {
    const { dispatch, nav } = this.props;
    return <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />;
  }
}

AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.object.isRequired,
  subscribeToTrips: PropTypes.func,
  subscribeToMessages: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    trips: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

const mapStateToProps = ({ auth, nav }) => ({
  auth,
  nav,
});

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => !ownProps.auth || !ownProps.auth.jwt,
  options: ownProps => ({ variables: { id: ownProps.auth.id } }),
  props: ({ data: { loading, user, subscribeToMore } }) => ({
    loading,
    user,
    subscribeToMessages() {
      return subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { tripIds: map(user.trips, 'id') },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousTrips = previousResult.user.trips;
          const newMessage = subscriptionData.data.messageAdded;

          const tripIndex = map(previousTrips, 'id').indexOf(newMessage.to.id);

          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.
          if (isDuplicateDocument(newMessage, previousTrips[tripIndex].messages)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              trips: {
                [tripIndex]: {
                  messages: { $set: [newMessage] },
                },
              },
            },
          });
        },
      });
    },
    subscribeToTrips() {
      return subscribeToMore({
        document: TRIP_ADDED_SUBSCRIPTION,
        variables: { userId: user.id },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousTrips = previousResult.user.trips;
          const newTrip = subscriptionData.data.tripAdded;

          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.
          if (isDuplicateDocument(newTrip, previousTrips)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              trips: { $push: [newTrip] },
            },
          });
        },
      });
    },
  }),
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(AppWithNavigationState);
