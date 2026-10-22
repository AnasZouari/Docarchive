import { gql } from '@apollo/client';

export const GET_DOCUMENTS = gql`
  query GetDocuments {
    documents {
      id
      title
      reference
      type
      file_path
      file_name
      file_size
      status
      created_at
      description
      document_date
      product

      service {
        id
        name
      }

      category {
        id
        name
      }

      folder {
        id
        name
      }

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

export const GET_CLASSIFICATION = gql`
  query GetClassification {
    services {
      id
      name
    }

    categories {
      id
      name
    }

    folders {
      id
      name

      service {
        id
        name
      }

      documents {
        id
        title
        reference
        status
      }
    }
  }
`;