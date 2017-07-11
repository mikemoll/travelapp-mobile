import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const TRIP_QUERY = gql`
  query trip($tripId: Int!, $limit: Int, $offset: Int) {
    trip(id: $tripId) {
      id
      name
      users {
        id
        username
      }
      messages(limit: $limit, offset: $offset) {
        ... MessageFragment
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default TRIP_QUERY;
