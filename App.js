import React, { Component } from 'react';
import { ApolloProvider } from 'react-apollo';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws-authy';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import { AsyncStorage } from 'react-native';

import AppWithNavigationState, { navigationReducer } from './components/routes';
import auth from './reducers/auth';
import { logout } from './actions/auth';

const networkInterface = createNetworkInterface({ uri: 'http://192.168.1.74:8000/graphql' });

// middleware for requests
networkInterface.use([{
  applyMiddleware (req, next) {
    if (!req.options.headers) {
      req.options.headers = {}; // eslint-disable-line no-param-reassign
    }

    // get the authentication token from local storage if it exists
    const jwt = store.getState().auth.jwt; // eslint-disable-line no-use-before-define
    if (jwt) {
      req.options.headers.authorization = `Bearer ${jwt}`; // eslint-disable-line no-param-reassign
    }
    next();
  }
}]);

// middleware for responses
networkInterface.useAfter([{
  applyAfterware ({ response }, next) {
    if (!response.ok) {
      response.clone().text().then((bodyText) => {
        // eslint-disable-next-line no-console
        console.log(`Network Error: ${response.status} (${response.statusText}) - ${bodyText}`);
        next();
      });
    } else {
      response.clone().json().then(({ errors }) => {
        if (errors) {
          errors.map((e) => {
            if (e.message === 'Unauthorized') {
              return store.dispatch(logout()); // eslint-disable-line no-use-before-define
            }
            return console.log('GraphQL Error:', e.message); // eslint-disable-line no-console
          });
        }
        next();
      });
    }
  }
}]);

// Create WebSocket client
const wsClient = new SubscriptionClient('ws://192.168.1.74:8000/subscriptions', {
  reconnect: true,
  connectionParams: {
    // Pass any arguments you want for initialization
  }
});

wsClient.use([{
  applyMiddleware (options, next) {
    // get the authentication token from local storage if it exists
    const jwt = store.getState().auth.jwt; // eslint-disable-line no-use-before-define
    if (jwt) {
      options.context = { jwt }; // eslint-disable-line no-param-reassign
    }
    next();
  }
}]);

// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
);

export const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions
});

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    auth,
    nav: navigationReducer
  }),
  {}, // initial state
  composeWithDevTools(
    applyMiddleware(client.middleware(), thunk),
    autoRehydrate()
  )
);

// persistent storage
persistStore(store, {
  storage: AsyncStorage,
  blacklist: ['apollo'] // don't persist apollo
});

// eslint-disable-next-line react/prefer-stateless-function
export default class App extends Component {
  render () {
    return (
      <ApolloProvider store={store} client={client}>
        <AppWithNavigationState />
      </ApolloProvider>
    );
  }
}
