import { _ } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { graphql, compose } from 'react-apollo';
import { NavigationActions } from 'react-navigation';
import update from 'immutability-helper';
import { connect } from 'react-redux';

import { USER_QUERY } from '../graphql/user.query';
import CREATE_TRIP_MUTATION from '../graphql/create-trip.mutation';
import SelectedUserList from '../components/selected-user-list.component';

const goToNewTrip = trip => NavigationActions.reset({
  index: 1,
  actions: [
    NavigationActions.navigate({ routeName: 'Main' }),
    NavigationActions.navigate({ routeName: 'Messages', params: { tripId: trip.id, title: trip.name } }),
  ],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'white',
  },
  detailsContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  imageContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  input: {
    color: 'black',
    height: 32,
  },
  inputBorder: {
    borderColor: '#dbdbdb',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  inputInstructions: {
    paddingTop: 6,
    color: '#777',
    fontSize: 12,
  },
  tripImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  selected: {
    flexDirection: 'row',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: 'blue',
    fontSize: 18,
    paddingTop: 2,
  },
  participants: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
});

// helper function checks for duplicate trips, which we receive because we
// get subscription updates for our own trips as well.
// TODO it's pretty inefficient to scan all the trips every time.
// maybe only scan the first 10, or up to a certain timestamp
function isDuplicateTrip(newTrip, existingTrips) {
  return newTrip.id !== null && existingTrips.some(trip => newTrip.id === trip.id);
}

class FinalizeTrip extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';
    return {
      title: 'New Trip',
      headerRight: (
        isReady ? <Button
          title="Create"
          onPress={state.params.create}
        /> : undefined
      ),
    };
  };

  constructor(props) {
    super(props);

    const { selected } = props.navigation.state.params;

    this.state = {
      selected,
    };

    this.create = this.create.bind(this);
    this.pop = this.pop.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected.length && this.state.name);
  }

  componentWillUpdate(nextProps, nextState) {
    if ((nextState.selected.length && nextState.name) !==
      (this.state.selected.length && this.state.name)) {
      this.refreshNavigation(nextState.selected.length && nextState.name);
    }
  }

  pop() {
    this.props.navigation.goBack();
  }

  remove(user) {
    const index = this.state.selected.indexOf(user);
    if (~index) {
      const selected = update(this.state.selected, { $splice: [[index, 1]] });
      this.setState({
        selected,
      });
    }
  }

  create() {
    const { createTrip } = this.props;

    createTrip({
      name: this.state.name,
      userIds: _.map(this.state.selected, 'id'),
    }).then((res) => {
      this.props.navigation.dispatch(goToNewTrip(res.data.createTrip));
    }).catch((error) => {
      Alert.alert(
        'Error Creating New Trip',
        error.message,
        [
          { text: 'OK', onPress: () => {} },
        ],
      );
    });
  }

  refreshNavigation(ready) {
    const { navigation } = this.props;
    navigation.setParams({
      mode: ready ? 'ready' : undefined,
      create: this.create,
    });
  }

  render() {
    const { friendCount } = this.props.navigation.state.params;

    return (
      <View style={styles.container}>
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.imageContainer}>
            <Image
              style={styles.tripImage}
              source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
            />
            <Text>edit</Text>
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <View style={styles.inputBorder}>
              <TextInput
                autoFocus
                onChangeText={name => this.setState({ name })}
                placeholder="Trip Subject"
                style={styles.input}
              />
            </View>
            <Text style={styles.inputInstructions}>
              {'Please provide a trip subject and optional trip icon'}
            </Text>
          </View>
        </View>
        <Text style={styles.participants}>
          {`participants: ${this.state.selected.length} of ${friendCount}`.toUpperCase()}
        </Text>
        <View style={styles.selected}>
          {this.state.selected.length ?
            <SelectedUserList
              data={this.state.selected}
              remove={this.remove}
            /> : undefined}
        </View>
      </View>
    );
  }
}

FinalizeTrip.propTypes = {
  createTrip: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    dispatch: PropTypes.func,
    goBack: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        friendCount: PropTypes.number.isRequired,
      }),
    }),
  }),
};

const createTripMutation = graphql(CREATE_TRIP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createTrip: ({ name, userIds }) =>
      mutate({
        variables: { name, userIds },
        update: (store, { data: { createTrip } }) => {
          // Read the data from our cache for this query.
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          if (isDuplicateTrip(createTrip, data.user.trips)) {
            return;
          }

          // Add our message from the mutation to the end.
          data.user.trips.push(createTrip);

          // Write our data back to the cache.
          store.writeQuery({
            query: USER_QUERY,
            variables: { id: ownProps.auth.id },
            data,
          });
        },
      }),
  }),
});

const userQuery = graphql(USER_QUERY, {
  options: ownProps => ({
    variables: {
      id: ownProps.navigation.state.params.userId,
    },
  }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
  createTripMutation,
)(FinalizeTrip);
