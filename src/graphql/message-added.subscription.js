import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription onMessageAdded($tripIds: [Int]){
    messageAdded(tripIds: $tripIds){
      ... MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default MESSAGE_ADDED_SUBSCRIPTION;
