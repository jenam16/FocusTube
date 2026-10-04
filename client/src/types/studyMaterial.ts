export interface StudyMaterial {
  _id: string;
  userId: string;
  name: string;
  originalUrl: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyMaterialPayload {
  name: string;
  originalUrl: string;
  fileType?: string;
}

export interface UpdateStudyMaterialPayload {
  name?: string;
  originalUrl?: string;
  fileType?: string;
}

export interface StudyMaterialsResponse {
  materials: StudyMaterial[];
}

export interface StudyMaterialResponse {
  material: StudyMaterial;
  message?: string;
}
