import { useState } from "react";

export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

type Data = {
  entries: Entry[];
  nextEntryId: number;
};
// const [error, setError] = useState<unknown>();

const dataKey = 'code-journal-data';



export async function readEntries(): Promise<Entry[]> {

    const response = await fetch('/api/entries');
    if (!response) {
      throw new Error('failed to fetch entries');
    }
    return await response.json();
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
    const response = await fetch(`/api/entries/${entryId}`);
    if(!response){
      throw new Error(`failed to fetch entry ${entryId}`);
    }
    const entry = await response.json()
    return entry
}

export async function addEntry(entry: Entry): Promise<Entry> {

    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (!response) {
      throw new Error('failed to fetch entries');
    }
    const addedEntry = await response.json();
    return addedEntry
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const response = await fetch(`/api/entries/${entry.entryId}`,{
    method: 'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(entry)
  });

  if (!response.ok) {
    throw new Error('Failed to update entry');
  }
  return await response.json();
}

export async function removeEntry(entryId: number): Promise<void> {
  const response = await fetch(`/api/entries/${entryId}`,{
    method: 'DELETE'
  });
  if(!response){
    throw new Error('failed to delete entry');
  }
}
