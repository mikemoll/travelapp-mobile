import gql from 'graphql-tag';

const REGISTER_PERSON_MUTATION = gql`
    mutation registerPerson($firstName: String! $lastName: String! $email: String!, $password: String!){
        registerPerson(input: { firstName: $firstName, lastName: $lastName, email: $email, password: $password }) {
            person {
                id
                firstName
                lastName
                createdAt
            }
        }
        authenticate(input: { email: $email, password: $password }) {
            jwtToken
        }
    }
`;

export default REGISTER_PERSON_MUTATION;
