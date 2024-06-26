import { User } from './UserContext';

const authKey = 'um.auth';

export function saveAuth(user: User, token: string): void {
  sessionStorage.setItem(authKey, JSON.stringify({ user, token }));
}

export function removeAuth(): void {
  sessionStorage.removeItem(authKey);
}

export function readUser(): User | undefined {
  const auth = sessionStorage.getItem(authKey);
  if (!auth) return undefined;
  return JSON.parse(auth).user;
}

export function readToken(): string | undefined {
  const auth = sessionStorage.getItem(authKey);
  if (!auth) return undefined;
  return JSON.parse(auth).token;
}

export type UnsavedTodo = {
  task: string;
  isCompleted: boolean;
};
export type Todo = UnsavedTodo & {
  todoId: number;
};

export async function readTodos(): Promise<Todo[]> {
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await fetch('/api/todos', req);
  if (!res.ok) throw new Error(`fetch Error ${res.status}`);
  return await res.json();
}

export async function insertTodo(todo: UnsavedTodo): Promise<Todo> {
  const token = readToken();

  const req = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(todo),
  };
  const res = await fetch('/api/todos', req);
  if (!res.ok) throw new Error(`fetch Error ${res.status}`);
  return await res.json();
}

export async function updateTodo(todo: Todo): Promise<Todo> {
  const token = readToken();
  const req = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(todo),
  };
  const res = await fetch(`/api/todos/${todo.todoId}`, req);
  if (!res.ok) throw new Error(`fetch Error ${res.status}`);
  return await res.json();
}

export async function removeTodo(todoId: number): Promise<void> {
  const token = readToken();
  const req = {
    method: 'DELETE',
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`/api/todos/${todoId}`, req);
  if (!res.ok) throw new Error(`fetch Error ${res.status}`);
}
