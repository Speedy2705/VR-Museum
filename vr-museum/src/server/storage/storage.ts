export type StoredFile = {
  url: string;
  filename: string;
  extension: string;
  contentType: string;
  size: number;
};

export interface FileStorage {
  save(file: File): Promise<StoredFile>;
  delete(urls: string | string[]): Promise<void>;
}
