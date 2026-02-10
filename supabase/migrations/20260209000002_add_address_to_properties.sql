-- Add address column to properties table
alter table properties add column if not exists address text;
