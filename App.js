import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import { ApolloProvider } from 'react-apollo';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import _ from 'lodash';

import AppWithNavigationState, { navigationReducer } from './src/navigation';
import auth from './src/reducers/auth.reducer';
import { logout } from './src/actions/auth.actions';

const networkInterface = createNetworkInterface({ uri: 'http://192.168.1.64:8080/graphql' });

// middleware for requests
networkInterface.use([{
  applyMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};
    }
    // get the authentication token from local storage if it exists
    const jwt = store.getState().auth.jwt;
    if (jwt) {
      req.options.headers.authorization = `Bearer ${jwt}`;
    }
    next();
  }
}]);

// afterware for responses
networkInterface.useAfter([{
  applyAfterware({ response }, next) {
    if (!response.ok) {
      response.clone().text().then((bodyText) => {
        console.log(`Network Error: ${response.status} (${response.statusText}) - ${bodyText}`);
        next();
      });
    } else {
      let isUnauthorized = false;
      response.clone().json().then(({ errors }) => {
        if (errors) {
          console.log('GraphQL Errors:', errors);
          if (_.some(errors, { message: 'Unauthorized' })) {
            isUnauthorized = true;
          }
        }
      }).then(() => {
        if (isUnauthorized) {
          store.dispatch(logout());
        }
        next();
      });
    }
  }
}]);

// Create WebSocket client
export const wsClient = new SubscriptionClient('ws://192.168.1.64:8080/subscriptions', {
  reconnect: true,
  connectionParams() {
    // get the authentication token from local storage if it exists
    return { jwt: store.getState().auth.jwt };
  },
  lazy: true
});

// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
);

export const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    nav: navigationReducer,
    auth
  }),
  {}, // initial state
  composeWithDevTools(
    applyMiddleware(client.middleware(), thunk),
    autoRehydrate()
  ),
);

// persistent storage
persistStore(store, {
  storage: AsyncStorage,
  blacklist: ['apollo'] // don't persist apollo for now
});

export default class App extends Component {
  render() {
    return (
      <ApolloProvider store={store} client={client}>
        <AppWithNavigationState />
      </ApolloProvider>
    );
  }
}
