import gql from 'graphql-tag';

const LEAVE_TRIP_MUTATION = gql`
  mutation leaveTrip($id: Int!) {
    leaveTrip(id: $id) {
      id
    }
  }
`;

export default LEAVE_TRIP_MUTATION;
