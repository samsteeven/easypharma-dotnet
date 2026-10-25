import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BackendResponse } from './user.service';

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private apiUrl = '/api/v1/files/upload';
    private baseFileUrl = '/api/v1/files';

    // Validation constants
    private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

    constructor(private http: HttpClient) { }

    /**
     * Valide un fichier avant upload
     */
    validateFile(file: File): FileValidationResult {
        // Vérifier la taille
        if (file.size > this.MAX_FILE_SIZE) {
            return { valid: false, error: 'Fichier trop volumineux. Taille maximale: 5MB' };
        }

        // Vérifier le type MIME
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            return { valid: false, error: 'Type de fichier non autorisé. Types acceptés: JPG, PNG, GIF, PDF' };
        }

        // Vérifier l'extension
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
            return { valid: false, error: 'Extension de fichier non autorisée' };
        }

        return { valid: true };
    }

    /**
     * Upload un fichier avec validation
     */
    upload(file: File, subdirectory: string = 'general'): Observable<string> {
        // Validation côté client
        const validation = this.validateFile(file);
        if (!validation.valid) {
            return throwError(() => new Error(validation.error));
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subdirectory', subdirectory);

        return this.http.post<BackendResponse<{ fileUrl: string; fileName: string }>>(this.apiUrl, formData)
            .pipe(
                map(response => response.data.fileUrl),
                catchError(this.handleError)
            );
    }

    /**
     * Construit l'URL complète d'un fichier
     */
    getFileUrl(relativePath: string): string {
        if (relativePath.startsWith('/')) {
            return relativePath;
        }
        return `${this.baseFileUrl}/${relativePath}`;
    }

    /**
     * Supprime un fichier
     */
    deleteFile(subdirectory: string, filename: string): Observable<void> {
        return this.http.delete<BackendResponse<void>>(`${this.baseFileUrl}/${subdirectory}/${filename}`)
            .pipe(
                map(() => undefined),
                catchError(this.handleError)
            );
    }

    /**
     * Gestion des erreurs
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Une erreur est survenue lors de l\'upload';

        if (error.error instanceof ErrorEvent) {
            // Erreur côté client
            errorMessage = error.error.message;
        } else {
            // Erreur côté serveur
            if (error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.status === 413) {
                errorMessage = 'Fichier trop volumineux';
            } else if (error.status === 415) {
                errorMessage = 'Type de fichier non supporté';
            }
        }

        return throwError(() => new Error(errorMessage));
    }
}
