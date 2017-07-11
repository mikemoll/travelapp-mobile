// TODO: update trip functionality
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Button,
  Image,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { graphql, compose } from 'react-apollo';
import { NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';

import TRIP_QUERY from '../graphql/trip.query';
import USER_QUERY from '../graphql/user.query';
import DELETE_TRIP_MUTATION from '../graphql/delete-trip.mutation';
import LEAVE_TRIP_MUTATION from '../graphql/leave-trip.mutation';

const resetAction = NavigationActions.reset({
  index: 0,
  actions: [
    NavigationActions.navigate({ routeName: 'Main' }),
  ],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripImageContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    alignItems: 'center',
  },
  tripName: {
    color: 'black',
  },
  tripNameBorder: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  tripImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  participants: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
  user: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    flexDirection: 'row',
    padding: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

class TripDetails extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.title}`,
  });

  constructor(props) {
    super(props);

    this.deleteTrip = this.deleteTrip.bind(this);
    this.leaveTrip = this.leaveTrip.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  deleteTrip() {
    this.props.deleteTrip(this.props.navigation.state.params.id)
      .then(() => {
        this.props.navigation.dispatch(resetAction);
      })
      .catch((e) => {
        console.log(e);   // eslint-disable-line no-console
      });
  }

  leaveTrip() {
    this.props.leaveTrip({
      id: this.props.navigation.state.params.id,
    })
      .then(() => {
        this.props.navigation.dispatch(resetAction);
      })
      .catch((e) => {
        console.log(e);   // eslint-disable-line no-console
      });
  }

  keyExtractor = item => item.id;

  renderItem = ({ item: user }) => (
    <View style={styles.user}>
      <Image
        style={styles.avatar}
        source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
      />
      <Text style={styles.username}>{user.username}</Text>
    </View>
  )

  render() {
    const { trip, loading } = this.props;

    // render loading placeholder while we fetch messages
    if (!trip || loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={trip.users}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.detailsContainer}>
                <TouchableOpacity style={styles.tripImageContainer} onPress={this.pickTripImage}>
                  <Image
                    style={styles.tripImage}
                    source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
                  />
                  <Text>edit</Text>
                </TouchableOpacity>
                <View style={styles.tripNameBorder}>
                  <Text style={styles.tripName}>{trip.name}</Text>
                </View>
              </View>
              <Text style={styles.participants}>
                {`participants: ${trip.users.length}`.toUpperCase()}
              </Text>
            </View>
          )}
          ListFooterComponent={() => (
            <View>
              <Button title={'Leave Trip'} onPress={this.leaveTrip} />
              <Button title={'Delete Trip'} onPress={this.deleteTrip} />
            </View>
          )}
        />
      </View>
    );
  }
}

TripDetails.propTypes = {
  loading: PropTypes.bool,
  trip: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
  }),
  navigation: PropTypes.shape({
    dispatch: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        title: PropTypes.string,
        id: PropTypes.number,
      }),
    }),
  }),
  deleteTrip: PropTypes.func.isRequired,
  leaveTrip: PropTypes.func.isRequired,
};

const tripQuery = graphql(TRIP_QUERY, {
  options: ownProps => ({ variables: { tripId: ownProps.navigation.state.params.id } }),
  props: ({ data: { loading, trip } }) => ({
    loading,
    trip,
  }),
});

const deleteTripMutation = graphql(DELETE_TRIP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    deleteTrip: id =>
      mutate({
        variables: { id },
        update: (store, { data: { deleteTrip } }) => {
          // Read the data from our cache for this query.
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          // Add our message from the mutation to the end.
          data.user.trips = data.user.trips.filter(g => deleteTrip.id !== g.id);

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

const leaveTripMutation = graphql(LEAVE_TRIP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    leaveTrip: ({ id }) =>
      mutate({
        variables: { id },
        update: (store, { data: { leaveTrip } }) => {
          // Read the data from our cache for this query.
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          // Add our message from the mutation to the end.
          data.user.trips = data.user.trips.filter(g => leaveTrip.id !== g.id);

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

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  tripQuery,
  deleteTripMutation,
  leaveTripMutation,
)(TripDetails);
