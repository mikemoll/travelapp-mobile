import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  FlatList,
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { graphql, compose } from 'react-apollo';
import moment from 'moment';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { Ionicons } from '@expo/vector-icons';
import { connect } from 'react-redux';

import { USER_QUERY } from '../graphql/user.query';

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: null,
    height: null,
  },
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  tripContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'white',
    // borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tripName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
  tripTextContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 6,
  },
  tripText: {
    color: '#8c8c8c',
  },
  tripImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  tripTitleContainer: {
    flexDirection: 'row',
  },
  tripLastUpdated: {
    flex: 0.3,
    color: '#8c8c8c',
    fontSize: 11,
    textAlign: 'right',
  },
  tripUsername: {
    paddingVertical: 4,
  },
  header: {
    alignItems: 'flex-end',
    padding: 6,
    borderColor: '#eee',
    borderBottomWidth: 1,
  },
  warning: {
    textAlign: 'center',
    padding: 12,
  },
});

// format createdAt with moment
const formatCreatedAt = createdAt => moment(createdAt).calendar(null, {
  sameDay: '[Today]',
  nextDay: '[Tomorrow]',
  nextWeek: 'dddd',
  lastDay: '[Yesterday]',
  lastWeek: 'dddd',
  sameElse: 'DD/MM/YYYY',
});

const Header = ({ onPress }) => (
  <View style={styles.header}>
    <Button title={'New Trip'} onPress={onPress} />
  </View>
);
Header.propTypes = {
  onPress: PropTypes.func.isRequired,
};

class Trip extends Component {
  constructor(props) {
    super(props);

    this.goToMessages = this.props.goToMessages.bind(this, this.props.trip);
  }

  render() {
    const { id, name, messages } = this.props.trip;
    return (
      <Image source={{uri: 'https://image.ibb.co/eWp9ua/bglogin.png'}} style={styles.backgroundImage}>
        <TouchableHighlight
          key={id}
          onPress={this.goToMessages}
        >
          <View style={styles.tripContainer}>
            <Image
              style={styles.tripImage}
              source={{
                uri: 'https://facebook.github.io/react/img/logo_og.png'
              }}
            />
            <View style={styles.tripTextContainer}>
              <View style={styles.tripTitleContainer}>
                <Text style={styles.tripName}>{`${name}`}</Text>
                <Text style={styles.tripLastUpdated}>
                  {messages.length ?
                     formatCreatedAt(messages[0].createdAt) : ''}
                </Text>
              </View>
              <Text style={styles.tripUsername}>
                {messages.length ?
                    `${messages[0].from.username}:` : ''}
              </Text>
              <Text style={styles.tripText} numberOfLines={1}>
                {messages.length ? messages[0].text : ''}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      </Image>
    );
  }
}

Trip.propTypes = {
  goToMessages: PropTypes.func.isRequired,
  trip: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    messages: PropTypes.array,
  }),
};

class Trips extends Component {
  static navigationOptions = {
    title: 'TravelApp',
  };

  constructor(props) {
    super(props);
    this.goToMessages = this.goToMessages.bind(this);
    this.goToNewTrip = this.goToNewTrip.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }

  onRefresh() {
    this.props.refetch();
  }

  keyExtractor = item => item.id;

  goToMessages(trip) {
    const { navigate } = this.props.navigation;
    navigate('Messages', { tripId: trip.id, title: trip.name });
  }

  goToNewTrip() {
    const { navigate } = this.props.navigation;
    navigate('NewTrip');
  }

  renderItem = ({ item }) => <Trip trip={item} goToMessages={this.goToMessages} />;

  render() {
    const { loading, user, networkStatus } = this.props;

    // render loading placeholder while we fetch messages
    if (loading || !user) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    if (user && !user.trips.length) {
      return (
        <View style={styles.container}>
          <Header onPress={this.goToNewTrip} />
          <Text style={styles.warning}>{'You do not have any trips.'}</Text>
        </View>
      );
    }

    // render list of trips for user
    return (
      <View style={styles.container}>
        <FlatList
          data={user.trips}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          ListHeaderComponent={() => <Header onPress={this.goToNewTrip} />}
          onRefresh={this.onRefresh}
          refreshing={networkStatus === 4}
        />
      </View>
    );
  }
}
Trips.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  loading: PropTypes.bool,
  networkStatus: PropTypes.number,
  refetch: PropTypes.func,
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

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => !ownProps.auth || !ownProps.auth.jwt,
  options: ownProps => ({ variables: { id: ownProps.auth.id } }),
  props: ({ data: { loading, networkStatus, refetch, user } }) => ({
    loading, networkStatus, refetch, user,
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(Trips);
