import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const CREATE_MESSAGE_MUTATION = gql`
  mutation createMessage($text: String!, $tripId: Int!) {
    createMessage(text: $text, tripId: $tripId) {
      ... MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default CREATE_MESSAGE_MUTATION;
