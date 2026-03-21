"use server"

import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Input validation schema using Zod
const createPromptSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  outputType: z.enum(['chat', 'image', 'video']),
  promptText: z.string().min(10, "Prompt must be at least 10 characters").max(5000, "Prompt is too long"),
});

export async function createPrompt(formData: FormData) {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "You must be logged in to create a prompt." };
    }

    // Validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      outputType: formData.get('outputType') as string,
      promptText: formData.get('promptText') as string,
    };

    const validatedData = createPromptSchema.parse(rawData);

    // Business Logic: For now, only 'chat' is supported
    if (validatedData.outputType !== 'chat') {
      return { success: false, error: `${validatedData.outputType} prompts are coming soon!` };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server is missing Supabase configuration");
    }

    // Use service role to bypass RLS for inserting. Alternatively, you could use anon key and rely on RLS if passing the user's token.
    // For simplicity and matching existing patterns, using the admin client.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the prompt into Supabase
    const { error } = await supabaseAdmin
      .from('prompts')
      .insert([
        {
          user_id: user.id, // Storing Clerk user ID
          title: validatedData.title,
          description: validatedData.description,
          output_type: validatedData.outputType,
          prompt_text: validatedData.promptText,
        }
      ]);

    if (error) {
      console.error("Error creating prompt:", error);
      return { success: false, error: `Failed to create prompt: ${error.message}` };
    }

    if (user.username) {
        revalidatePath(`/${user.username}`);
    }
    revalidatePath('/create');

    return { success: true };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || "Validation failed" };
    }
    console.error("Unhandled error creating prompt:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllPrompts(category?: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server is missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabaseAdmin.from('prompts').select('id, title, description, output_type, created_at');

    if (category && category !== 'trending') {
        query = query.eq('output_type', category);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching all prompts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unhandled error fetching all prompts:", error);
    return [];
  }
}

export async function getUserPrompts(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server is missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .select('id, title, description, output_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user prompts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unhandled error fetching prompts:", error);
    return [];
  }
}

export async function getPromptForEdit(promptId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "You must be logged in." };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server is missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error || !data) {
      return { success: false, error: "Prompt not found." };
    }

    if (data.user_id !== user.id) {
      return { success: false, error: "Unauthorized." };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unhandled error fetching prompt for edit:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updatePrompt(promptId: string, formData: FormData) {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "You must be logged in to update a prompt." };
    }

    // Validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      outputType: formData.get('outputType') as string,
      promptText: formData.get('promptText') as string,
    };

    const validatedData = createPromptSchema.parse(rawData);

    if (validatedData.outputType !== 'chat') {
      return { success: false, error: `${validatedData.outputType} prompts are coming soon!` };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server is missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check ownership first
    const { data: existingPrompt, error: checkError } = await supabaseAdmin
      .from('prompts')
      .select('user_id')
      .eq('id', promptId)
      .single();
      
    if (checkError || !existingPrompt) {
        return { success: false, error: "Prompt not found." };
    }
    
    if (existingPrompt.user_id !== user.id) {
        return { success: false, error: "Unauthorized." };
    }

    // Update the prompt
    const { error } = await supabaseAdmin
      .from('prompts')
      .update({
          title: validatedData.title,
          description: validatedData.description,
          output_type: validatedData.outputType,
          prompt_text: validatedData.promptText,
      })
      .eq('id', promptId);

    if (error) {
      console.error("Error updating prompt:", error);
      return { success: false, error: `Failed to update prompt: ${error.message}` };
    }

    if (user.username) {
        revalidatePath(`/${user.username}`);
    }
    revalidatePath('/create');
    revalidatePath(`/edit/${promptId}`);

    return { success: true };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || "Validation failed" };
    }
    console.error("Unhandled error updating prompt:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

