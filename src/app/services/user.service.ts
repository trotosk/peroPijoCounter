import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class UserService {
  private key = 'users';

  constructor(private storage: StorageService) {}

  private loadAll(): User[] {
    return this.storage.get<User[]>(this.key) || [];
  }
  private saveAll(users: User[]) {
    this.storage.set(this.key, users);
  }

  create(email: string, name: string, password: string): User {
    const users = this.loadAll();
    if (users.find(u => u.email === email)) {
      throw new Error('Email ya registrado');
    }
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      email,
      name,
      password: password.slice(0, 15),
      createdAt: now,
      updatedAt: now
    };
    users.push(user);
    this.saveAll(users);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.loadAll().find(u => u.email === email);
  }

  findById(id: string): User | undefined {
    return this.loadAll().find(u => u.id === id);
  }

  update(user: User) {
    const users = this.loadAll();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) throw new Error('Usuario no encontrado');
    user.updatedAt = new Date().toISOString();
    users[idx] = user;
    this.saveAll(users);
  }

  // NOTA: método inseguro (guarda password en texto). Tú pediste recuperar enviando password.
  getPasswordByEmail(email: string): string | null {
    const u = this.findByEmail(email);
    return u ? u.password : null;
  }
}
