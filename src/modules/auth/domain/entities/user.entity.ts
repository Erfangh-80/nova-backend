export interface User {
    id: string;
    email: string;
    passwordHash: string;

    firstName: string | null;
    lastName: string | null;
    address: string | null;
    nationalCode: string | null;
    postalCode: string | null;
    phone: string | null;

    createdAt: Date;
    updatedAt: Date;
}