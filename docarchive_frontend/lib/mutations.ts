import { gql } from '@apollo/client';

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($title: String!, $type: String!, $file: Upload!) {
    createDocument(title: $title, type: $type, file: $file) {
      id
      title
      reference
      type
      status
      created_at
    }
  }
`;

export const ARCHIVE_DOCUMENT = gql`
  mutation ArchiveDocument($id: ID!, $reason: String) {
    archiveDocument(id: $id, reason: $reason) {
      id
      title
      status
    }
  }
`;

export const RESTORE_DOCUMENT = gql`
  mutation RestoreDocument($id: ID!) {
    restoreDocument(id: $id) {
      id
      title
      status
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;