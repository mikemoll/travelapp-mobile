import gql from 'graphql-tag';

const AUTHENTICATE_MUTATION = gql`
    mutation authenticate($email: String!, $password: String!){
        authenticate(input: { email: $email, password: $password }) {
            jwtToken
        }
    }
`;

export default AUTHENTICATE_MUTATION;
