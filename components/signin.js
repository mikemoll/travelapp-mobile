import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Button, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { graphql, compose } from 'react-apollo';
import { setCurrentUser } from '../actions/auth';
import AUTHENTICATE_MUTATION from '../graphql/authenticate.mutation';
import REGISTER_PERSON_MUTATION from '../graphql/registerPerson.mutation';

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 54, // nav bar height
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#eeeeee',
    paddingHorizontal: 50,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderRadius: 4,
    marginVertical: 6,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingContainer: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  switchAction: {
    paddingHorizontal: 4,
    color: 'blue',
  },
  submit: {
    marginVertical: 6,
  },
});

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

class Signin extends Component {
  static navigationOptions = {
    title: 'TravelApp',
    headerLeft: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      view: 'authenticate',
    };

    this.authenticate = this.authenticate.bind(this);
    this.registerPerson = this.registerPerson.bind(this);
    this.switchView = this.switchView.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.auth.jwt) {
      nextProps.navigation.goBack();
    }
  }

  authenticate() {
    const { email, password } = this.state;

    this.setState({
      loading: true,
    });

    this.props.authenticate({ email, password })
      .then(({ data: { authenticate: user } }) => {
        this.props.dispatch(setCurrentUser(user));
        this.setState({
          loading: false,
        });
      }).catch((error) => {
        this.setState({
          loading: false,
        });
        Alert.alert(
          `${capitalizeFirstLetter(this.state.view)} error`,
          error.message,
          [
            { text: 'OK', onPress: () => console.log('OK pressed') }, // eslint-disable-line no-console
            { text: 'Forgot password', onPress: () => console.log('Forgot Pressed'), style: 'cancel' }, // eslint-disable-line no-console
          ],
        );
      });
  }

  registerPerson() {
    this.setState({
      loading: true,
    });
    const { firstName, lastName, email, password } = this.state;
    this.props.registerPerson({ firstName, lastName, email, password })
      .then(({ data: { registerPerson: user, authenticate: jwtToken } }) => {
        user.token = jwtToken; // since we're getting two returns, we merge them
        this.props.dispatch(setCurrentUser(user));
        this.setState({
          loading: false,
        });
      }).catch((error) => {
        this.setState({
          loading: false,
        });
        Alert.alert(
          `${capitalizeFirstLetter(this.state.view)} error`,
          error.message,
          [{ text: 'OK', onPress: () => console.log('OK pressed') }],  // eslint-disable-line no-console
        );
      });
  }

  switchView() {
    this.setState({
      view: this.state.view === 'registerPerson' ? 'authenticate' : 'registerPerson',
    });
  }

  render() {
    const { view } = this.state;

    return (
      <KeyboardAvoidingView behavior={'padding'} style={styles.container}>
        {this.state.loading ?
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
          </View> : undefined}
        <View style={styles.inputContainer}>
          {view === 'registerPerson' ?
          <TextInput
          onChangeText={firstName => this.setState({ firstName })}
          placeholder={'First Name'}
          style={styles.input}
          />
           : null}
          {view === 'registerPerson' ?
          <TextInput
          onChangeText={lastName => this.setState({ lastName })}
            placeholder={'Last Name'}
            style={styles.input}
            />
            : null}
          <TextInput
            onChangeText={email => this.setState({ email })}
            placeholder={'Email'}
            style={styles.input}
          />
          <TextInput
            onChangeText={password => this.setState({ password })}
            placeholder={'Password'}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <Button
          onPress={this[view]}
          style={styles.submit}
          title={view === 'registerPerson' ? 'Sign up' : 'Login'}
          disabled={this.state.loading || !!this.props.auth.jwt}
        />
        <View style={styles.switchContainer}>
          <Text>
            { view === 'registerPerson' ? 'Already have an account?' : 'Not yet registered?' }
          </Text>
          <TouchableOpacity
            onPress={this.switchView}
          >
            <Text style={styles.switchAction}>
              {view === 'authenticate' ? 'Sign up' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

Signin.propTypes = {
  auth: PropTypes.shape({
    loading: PropTypes.bool,
    jwt: PropTypes.string,
  }),
  dispatch: PropTypes.func.isRequired,
  authenticate: PropTypes.func.isRequired,
  registerPerson: PropTypes.func.isRequired,
};

const authenticate = graphql(AUTHENTICATE_MUTATION, {
  props: ({ mutate }) => ({
    authenticate: ({ email, password }) =>
      mutate({
        variables: { email, password },
      }),
  }),
});

const registerPerson = graphql(REGISTER_PERSON_MUTATION, {
  props: ({ mutate }) => ({
    registerPerson: ({ firstName, lastName, email, password }) =>
      mutate({
        variables: { firstName, lastName, email, password },
      }),
  }),
});

const mapStateToProps = ({ auth }) => ({ auth });

export default compose(
  authenticate,
  registerPerson,
  connect(mapStateToProps),
)(Signin);
