export function isValidName(value)
{
    const trimmed = value.trim();
    return [...trimmed].length > 2 && /\p{L}/u.test(trimmed);
}
