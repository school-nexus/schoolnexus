"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SchoolContextType {
    schoolId: number | null;
    schoolSlug: string | null;
    isLoading: boolean;
    isPlatform: boolean; // True if running on the main platform domain (Super Admin)
}

const SchoolContext = createContext<SchoolContextType>({
    schoolId: null,
    schoolSlug: null,
    isLoading: true,
    isPlatform: false
});

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [schoolId] = useState<number | null>(null);
    const [schoolSlug, setSchoolSlug] = useState<string | null>(null);
    const [isPlatform, setIsPlatform] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const detectSchool = async () => {
            if (typeof window === 'undefined') return;

            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            
            // Logic for detecting school from subdomain
            // Example: school1.localhost:3000 or school1.schoolnexus.com
            if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'app') {
                const slug = parts[0];
                setSchoolSlug(slug);
                setIsPlatform(false);
                
                // Fetch school ID by slug from Platform API
                // For now, we'll assume a way to look this up
                // In a real app, this might be a call to a platform database
            } else {
                setIsPlatform(true);
            }
            
            setIsLoading(false);
        };

        detectSchool();
    }, []);

    return (
        <SchoolContext.Provider value={{ schoolId, schoolSlug, isLoading, isPlatform }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => useContext(SchoolContext);
