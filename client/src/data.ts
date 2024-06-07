import { readToken } from './removeSaveAuth';

export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

// type Data = {
//   entries: Entry[];
//   nextEntryId: number;
// };
// // const [error, setError] = useState<unknown>();

// const dataKey = 'code-journal-data';

export async function readEntries(): Promise<Entry[]> {
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch('/api/entries', req);
  if (!response) {
    throw new Error('failed to fetch entries');
  }
  return await response.json();
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(`/api/entries/${entryId}`, req);
  if (!response) {
    throw new Error(`failed to fetch entry ${entryId}`);
  }
  const entry = await response.json();
  return entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const token = readToken();

  const response = await fetch('/api/entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  if (!response) {
    throw new Error('failed to fetch entries');
  }
  const addedEntry = await response.json();
  return addedEntry;
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const token = readToken();
  const response = await fetch(`/api/entries/${entry.entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error('Failed to update entry');
  }
  return await response.json();
}

export async function removeEntry(entryId: number): Promise<void> {
  const token = readToken();
  const response = await fetch(`/api/entries/${entryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response) {
    throw new Error('failed to delete entry');
  }
}
