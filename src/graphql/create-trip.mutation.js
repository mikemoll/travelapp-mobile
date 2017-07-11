import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const CREATE_TRIP_MUTATION = gql`
  mutation createTrip($name: String!, $userIds: [Int!]) {
    createTrip(name: $name, userIds: $userIds) {
      id
      name
      users {
        id
      }
      messages(limit: 1) { # we don't need to use variables
        ... MessageFragment
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default CREATE_TRIP_MUTATION;
