'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';

import { useAuth } from './AuthProvider';
import { hasAdminRole } from '@/lib/auth';
import { CREATE_DOCUMENT } from '@/lib/mutations';
import { GET_CLASSIFICATION } from '@/lib/queries';

type Item = {
  id: string;
  name: string;
};

type Folder = Item & {
  service: Item;
};

const emptyMetadata = {
  service_id: '',
  category_id: '',
  folder_id: '',
  description: '',
  document_date: '',
  product: '',
};

const field =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100';

export default function UploadForm({
  onUpload,
}: {
  onUpload: () => void;
}) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState(emptyMetadata);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data,
    loading: classificationLoading,
    error: classificationError,
    refetch,
  } = useQuery(GET_CLASSIFICATION);

  const [createDocument, { loading }] =
    useMutation(CREATE_DOCUMENT);

  const isAdmin = hasAdminRole(user);

  const canUpload =
    isAdmin ||
    (user?.role === 'agent' && user.service_id != null);

  const selectedService =
    user?.role === 'agent'
      ? String(user.service_id ?? '')
      : metadata.service_id;

  const services: Item[] = data?.services ?? [];
  const categories: Item[] = data?.categories ?? [];
  const folders: Folder[] = data?.folders ?? [];

  const availableFolders = folders.filter(
    folder => String(folder.service.id) === selectedService
  );

  const disabled =
    !canUpload ||
    loading ||
    classificationLoading ||
    Boolean(classificationError);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canUpload) {
      toast.error('Demandez une affectation à votre administrateur.');
      return;
    }

    if (!title.trim() || !file) {
      toast.error('Saisissez un titre et choisissez un fichier.');
      return;
    }

    if (!selectedService) {
      toast.error('Choisissez un service.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo.');
      return;
    }

    try {
      await createDocument({
        variables: {
          title: title.trim(),
          type,
          file,
          service_id: selectedService,
          category_id: metadata.category_id || null,
          folder_id: metadata.folder_id || null,
          description: metadata.description.trim() || null,
          document_date: metadata.document_date || null,
          product: metadata.product || null,
        },
      });

      setTitle('');
      setFile(null);
      setMetadata(emptyMetadata);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      toast.success('Document ajouté.');
      onUpload();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <form
      id="upload"
      onSubmit={submit}
      aria-busy={loading}
      className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-semibold">
          Ajouter un document
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez un fichier et renseignez son classement.
        </p>
      </div>

      {!canUpload && (
        <p role="alert" className="px-6 pt-4 text-amber-700">
          Contactez votre administrateur pour être affecté à un service.
        </p>
      )}

      {classificationError && (
        <div role="alert" className="px-6 pt-4 text-red-700">
          Impossible de charger le classement.
          <button
            type="button"
            onClick={() => {
              void refetch().catch(error =>
                toast.error(error.message)
              );
            }}
            className="ml-3 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      <fieldset
        disabled={disabled}
        className="grid gap-5 p-6 md:grid-cols-2"
      >
        <label className="text-sm font-medium">
          Titre du document
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            required
            maxLength={255}
            className={field}
          />
        </label>

        <label className="text-sm font-medium">
          Type
          <select
            value={type}
            onChange={event => setType(event.target.value)}
            className={field}
          >
            {[
              'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX',
              'PPT', 'PPTX', 'JSON', 'Image', 'Other',
            ].map(value => (
              <option key={value} value={value}>
                {value === 'Other' ? 'Autre' : value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Service
          <select
            value={selectedService}
            disabled={!isAdmin}
            required
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                service_id: event.target.value,
                folder_id: '',
              }))
            }
            className={field}
          >
            <option value="">Choisir un service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Catégorie
          <select
            value={metadata.category_id}
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                category_id: event.target.value,
              }))
            }
            className={field}
          >
            <option value="">Sans catégorie</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Dossier
          <select
            value={metadata.folder_id}
            disabled={!selectedService}
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                folder_id: event.target.value,
              }))
            }
            className={field}
          >
            <option value="">Sans dossier</option>
            {availableFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Date du document
          <input
            type="date"
            value={metadata.document_date}
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                document_date: event.target.value,
              }))
            }
            className={field}
          />
        </label>

        <label className="text-sm font-medium">
          Produit concerné
          <select
            value={metadata.product}
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                product: event.target.value,
              }))
            }
            className={field}
          >
            <option value="">Non concerné</option>
            {['Riz', 'Sucre', 'Café', 'Thé', 'Autre'].map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Fichier — maximum 10 Mo
          <input
            ref={inputRef}
            type="file"
            required
            onChange={event =>
              setFile(event.target.files?.[0] ?? null)
            }
            className={field}
          />
        </label>

        <label className="text-sm font-medium md:col-span-2">
          Description
          <textarea
            rows={3}
            maxLength={5000}
            value={metadata.description}
            onChange={event =>
              setMetadata(previous => ({
                ...previous,
                description: event.target.value,
              }))
            }
            className={field}
          />
        </label>

        {isAdmin && (
          <Link
            href="/dossiers"
            className="text-sm text-blue-700 underline md:col-span-2"
          >
            Gérer les dossiers et le classement
          </Link>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-slate-50 p-6">
        <p role="status" className="text-xs text-slate-500">
          {loading
            ? 'Envoi en cours…'
            : 'Le fichier sera enregistré dans le stockage privé.'}
        </p>

        <button
          type="submit"
          disabled={disabled || !selectedService}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Ajouter le document'}
        </button>
      </div>
    </form>
  );
}