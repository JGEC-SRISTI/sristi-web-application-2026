-- Required profile text fields must contain at least one non-whitespace character.
-- NOT NULL alone still allows empty strings and whitespace-only values.
alter table
    public.profiles
add
    constraint profiles_full_name_not_blank check (full_name ~ '[^[:space:]]'),
add
    constraint profiles_phone_not_blank check (phone ~ '[^[:space:]]'),
add
    constraint profiles_college_name_not_blank check (college_name ~ '[^[:space:]]'),
add
    constraint profiles_college_roll_not_blank check (college_roll ~ '[^[:space:]]'),
add
    constraint profiles_department_not_blank check (department ~ '[^[:space:]]');