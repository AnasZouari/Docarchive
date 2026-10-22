import { gql } from '@apollo/client';

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument(
    $title: String!
    $type: String!
    $file: Upload!
    $service_id: ID
    $category_id: ID
    $folder_id: ID
    $description: String
    $document_date: String
    $product: String
  ) {
    createDocument(
      title: $title
      type: $type
      file: $file
      service_id: $service_id
      category_id: $category_id
      folder_id: $folder_id
      description: $description
      document_date: $document_date
      product: $product
    ) {
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

export const CREATE_SERVICE = gql`
  mutation CreateService($name: String!) {
    createService(name: $name) {
      id
      name
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!) {
    createCategory(name: $name) {
      id
      name
    }
  }
`;

export const CREATE_FOLDER = gql`
  mutation CreateFolder($name: String!, $service_id: ID!) {
    createFolder(name: $name, service_id: $service_id) {
      id
      name

      service {
        id
        name
      }
    }
  }
`;