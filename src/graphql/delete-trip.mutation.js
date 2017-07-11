import gql from 'graphql-tag';

const DELETE_TRIP_MUTATION = gql`
  mutation deleteTrip($id: Int!) {
    deleteTrip(id: $id) {
      id
    }
  }
`;

export default DELETE_TRIP_MUTATION;
