import { createClient } from '@supabase/supabase-js';

// TODO: 请替换为您自己的 Supabase URL 和 Anon Key
// 您可以在 Supabase 控制台的 Project Settings -> API 中找到这些信息
const supabaseUrl = 'https://gfhnqqptherrwkxhzkuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG5xcXB0aGVycndreGh6a3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDc1NDYsImV4cCI6MjA4NDM4MzU0Nn0.R5YCfqoW5ixHxHRn-UHnQ66GM0cWUVlFlhYvHwdOxgk';

export const supabase = createClient(supabaseUrl, supabaseKey);