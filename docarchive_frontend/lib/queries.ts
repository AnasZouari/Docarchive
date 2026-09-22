import { gql } from '@apollo/client';

export const GET_DOCUMENTS = gql`
  query GetDocuments {
    documents {
      id
      title
      reference
      type
      file_name
      file_size
      status
      created_at
      archives {
        id
        archive_date
        status
        reason
      }
    }
  }
`;

export const GET_DOCUMENT_STATS = gql`
  query GetDocumentStats {
    documentStats {
      total
      active
      archived
      totalSize
    }
  }
`;