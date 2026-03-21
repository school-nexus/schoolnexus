/**
 * Helper functions for JSON handling in SQLite
 * Since SQLite stores JSON as TEXT, we need to serialize/deserialize
 */

/**
 * Safely parse JSON string, returns null if invalid
 */
export function parseJson<T = any>(jsonString: string | null): T | null {
    if (!jsonString) return null;

    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return null;
    }
}

/**
 * Safely stringify object to JSON
 */
export function stringifyJson(obj: any): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.error('Failed to stringify JSON:', error);
        return '{}';
    }
}

/**
 * Parse JSON with default value
 */
export function parseJsonWithDefault<T>(jsonString: string | null, defaultValue: T): T {
    const parsed = parseJson<T>(jsonString);
    return parsed ?? defaultValue;
}

/**
 * Type-safe setting value parser
 */
export interface SettingValue {
    [key: string]: any;
}

export function parseSettingValue(value: string): SettingValue {
    return parseJsonWithDefault<SettingValue>(value, {});
}

/**
 * Type-safe activity log metadata parser
 */
export interface ActivityMetadata {
    [key: string]: any;
}

export function parseActivityMetadata(metadata: string | null): ActivityMetadata | null {
    return parseJson<ActivityMetadata>(metadata);
}
