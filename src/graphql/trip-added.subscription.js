import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const TRIP_ADDED_SUBSCRIPTION = gql`
  subscription onTripAdded($userId: Int){
    tripAdded(userId: $userId){
      id
      name
      messages(limit: 1) {
        ... MessageFragment
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default TRIP_ADDED_SUBSCRIPTION;