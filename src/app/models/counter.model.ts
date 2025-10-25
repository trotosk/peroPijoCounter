export interface CounterPair {
  name: string;
  value: number;
}

export interface CounterRecord {
  id: string; // uuid
  ownerId: string; // user id
  title: string;
  left: CounterPair;
  right: CounterPair;
  createdAt: string;
  updatedAt: string;
}
