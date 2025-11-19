import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { ensureOrganizationId } from './utils-organization.ts';
import { successResponse, errorResponse } from './utils-response.ts';
import { safeUpsert, sanitizeDbData } from './utils-db-safe.ts';
import { getSupabaseClient } from './kv_store.tsx';
// ✅ REFATORADO v1.0.103.500 - Helper híbrido para organization_id (UUID)
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';

const chat = new Hono();

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'guest' | 'staff' | 'system';
  sender_name: string;
  sender_id?: string;
  content: string;
  sent_at: string;
  read_at?: string;
  organization_id: string;
  attachments?: string[];
  
  // ============================================
  // 🆕 MULTI-CHANNEL SUPPORT (v1.0.101)
  // ============================================
  channel: 'internal' | 'whatsapp' | 'sms' | 'email';
  direction: 'incoming' | 'outgoing';
  
  // External integration data
  external_id?: string; // ID from Evolution API, Twilio, etc
  external_status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  external_error?: string;
  
  // Metadata for media and other channel-specific data
  metadata?: {
    media_url?: string;
    media_type?: string; // image, video, audio, document
    media_caption?: string;
    whatsapp_message_id?: string;
    sms_message_sid?: string;
    error_code?: string;
    error_message?: string;
  };
}

interface Conversation {
  id: string;
  organization_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  reservation_code?: string;
  property_name?: string;
  property_id?: string;
  channel: 'internal' | 'whatsapp' | 'sms' | 'email';
  status: 'unread' | 'read' | 'resolved';
  category: 'urgent' | 'normal' | 'resolved';
  conversation_type: 'guest' | 'lead';
  last_message: string;
  last_message_at: string;
  checkin_date?: string;
  checkout_date?: string;
  order?: number;
  isPinned?: boolean;
  tags?: string[];
  lead_data?: {
    desired_location?: string;
    num_guests?: number;
    desired_checkin?: string;
    desired_checkout?: string;
  };
  created_at: string;
  updated_at: string;
  
  // ============================================
  // 🆕 MULTI-CHANNEL SUPPORT (v1.0.101)
  // ============================================
  // External conversation ID (for WhatsApp, SMS, etc)
  external_conversation_id?: string;
  
  // Last channel used for this conversation
  last_channel?: 'internal' | 'whatsapp' | 'sms' | 'email';
  
  // Channel-specific metadata
  channel_metadata?: {
    whatsapp_contact_id?: string;
    whatsapp_profile_pic?: string;
    sms_phone_number?: string;
  };
}

interface MessageTemplate {
  id: string;
  organization_id: string;
  name: string;
  name_en?: string;
  name_es?: string;
  content: string;
  content_en?: string;
  content_es?: string;
  category: 'pre_checkin' | 'post_checkout' | 'during_stay' | 'payment' | 'general' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface ChatTag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
  conversations_count: number;
}

// ============================================
// 🆕 CHANNEL CONFIGURATION (v1.0.101)
// ============================================

interface EvolutionAPIConfig {
  enabled: boolean;
  api_url: string;
  instance_name: string;
  api_key: string;
  connected: boolean;
  phone_number?: string;
  qr_code?: string;
  connection_status?: 'disconnected' | 'connecting' | 'connected' | 'error';
  last_connected_at?: string;
  error_message?: string;
}

interface TwilioConfig {
  enabled: boolean;
  account_sid: string;
  auth_token: string;
  phone_number: string;
  credits_remaining?: number;
  credits_used?: number;
  last_recharged_at?: string;
}

interface OrganizationChannelConfig {
  organization_id: string;
  
  // WhatsApp (Evolution API)
  whatsapp?: EvolutionAPIConfig;
  
  // SMS (Twilio)
  sms?: TwilioConfig;
  
  // Automations
  automations?: {
    reservation_confirmation?: boolean;
    checkin_reminder?: boolean;
    checkout_review?: boolean;
    payment_reminder?: boolean;
  };
  
  // Auto-reply templates
  auto_reply_templates?: {
    [key: string]: string;
  };
  
  created_at: string;
  updated_at: string;
}

// ============================================
// CONVERSATIONS
// ============================================

// GET all conversations
chat.get('/conversations', async (c) => {
  try {
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const prefix = `chat:conversation:${orgId}:`;
    const conversations = await kv.getByPrefix<Conversation>(prefix);

    // Sort by order and last_message_at
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.order !== undefined && b.order !== undefined) {
        if (a.order !== b.order) return a.order - b.order;
      }
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    return c.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET single conversation
chat.get('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:conversation:${orgId}:${conversationId}`;
    const conversation = await kv.get<Conversation>(key);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    return c.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// POST create conversation
chat.post('/conversations', async (c) => {
  try {
    const body = await c.req.json();
    const {
      organization_id,
      guest_name,
      guest_email,
      guest_phone,
      reservation_code,
      property_name,
      property_id,
      channel = 'system',
      conversation_type = 'lead',
      checkin_date,
      checkout_date,
      lead_data,
    } = body;

    if (!organization_id || !guest_name || !guest_email) {
      return c.json({ 
        success: false, 
        error: 'organization_id, guest_name, and guest_email are required' 
      }, 400);
    }

    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const conversation: Conversation = {
      id: conversationId,
      organization_id,
      guest_name,
      guest_email,
      guest_phone: guest_phone || '',
      reservation_code,
      property_name,
      property_id,
      channel,
      status: 'unread',
      category: 'normal',
      conversation_type,
      last_message: 'Nova conversa iniciada',
      last_message_at: now,
      checkin_date,
      checkout_date,
      isPinned: false,
      tags: [],
      lead_data,
      created_at: now,
      updated_at: now,
    };

    const key = `chat:conversation:${organization_id}:${conversationId}`;
    await kv.set(key, conversation);

    return c.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH update conversation
chat.patch('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de body.organization_id
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:conversation:${orgId}:${conversationId}`;
    const conversation = await kv.get<Conversation>(key);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    const updated: Conversation = {
      ...conversation,
      ...body,
      id: conversationId,
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updated);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// DELETE conversation
chat.delete('/conversations/:id', async (c) => {
  try {
    const conversationId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:conversation:${orgId}:${conversationId}`;
    
    // Delete all messages for this conversation
    const messagesPrefix = `chat:message:${orgId}:${conversationId}:`;
    const messages = await kv.getByPrefix<Message>(messagesPrefix);
    
    for (const message of messages) {
      const messageKey = `chat:message:${orgId}:${conversationId}:${message.id}`;
      await kv.del(messageKey);
    }
    
    await kv.del(key);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH update conversation order (drag and drop)
chat.patch('/conversations/:id/order', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const { organization_id, order } = body;
    
    if (!organization_id) {
      return c.json({ success: false, error: 'organization_id is required' }, 400);
    }

    const key = `chat:conversation:${organization_id}:${conversationId}`;
    const conversation = await kv.get<Conversation>(key);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    conversation.order = order;
    conversation.updated_at = new Date().toISOString();

    await kv.set(key, conversation);

    return c.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error updating conversation order:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH toggle pin conversation
chat.patch('/conversations/:id/pin', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const { organization_id } = body;
    
    if (!organization_id) {
      return c.json({ success: false, error: 'organization_id is required' }, 400);
    }

    const key = `chat:conversation:${organization_id}:${conversationId}`;
    const conversation = await kv.get<Conversation>(key);

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    conversation.isPinned = !conversation.isPinned;
    conversation.updated_at = new Date().toISOString();

    await kv.set(key, conversation);

    return c.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error toggling pin:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// MESSAGES
// ============================================

// GET messages for a conversation
chat.get('/conversations/:id/messages', async (c) => {
  try {
    const conversationId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const prefix = `chat:message:${orgId}:${conversationId}:`;
    const messages = await kv.getByPrefix<Message>(prefix);

    // Sort by sent_at
    messages.sort((a, b) => 
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );

    return c.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// POST send message
chat.post('/conversations/:id/messages', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const {
      organization_id,
      sender_type,
      sender_name,
      sender_id,
      content,
      attachments,
    } = body;

    if (!organization_id || !sender_type || !sender_name || !content) {
      return c.json({ 
        success: false, 
        error: 'organization_id, sender_type, sender_name, and content are required' 
      }, 400);
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const message: Message = {
      id: messageId,
      conversation_id: conversationId,
      sender_type,
      sender_name,
      sender_id,
      content,
      sent_at: now,
      organization_id,
      attachments,
    };

    const messageKey = `chat:message:${organization_id}:${conversationId}:${messageId}`;
    await kv.set(messageKey, message);

    // Update conversation last_message
    const conversationKey = `chat:conversation:${organization_id}:${conversationId}`;
    const conversation = await kv.get<Conversation>(conversationKey);

    if (conversation) {
      conversation.last_message = content.substring(0, 100);
      conversation.last_message_at = now;
      if (sender_type === 'guest') {
        conversation.status = 'unread';
      }
      conversation.updated_at = now;
      await kv.set(conversationKey, conversation);
    }

    return c.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH mark message as read
chat.patch('/messages/:id/read', async (c) => {
  try {
    const messageId = c.req.param('id');
    const body = await c.req.json();
    const { organization_id, conversation_id } = body;
    
    if (!organization_id || !conversation_id) {
      return c.json({ 
        success: false, 
        error: 'organization_id and conversation_id are required' 
      }, 400);
    }

    const key = `chat:message:${organization_id}:${conversation_id}:${messageId}`;
    const message = await kv.get<Message>(key);

    if (!message) {
      return c.json({ success: false, error: 'Message not found' }, 404);
    }

    message.read_at = new Date().toISOString();
    await kv.set(key, message);

    return c.json({ success: true, data: message });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// TEMPLATES
// ============================================

// GET all templates
chat.get('/templates', async (c) => {
  try {
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const prefix = `chat:template:${orgId}:`;
    const templates = await kv.getByPrefix<MessageTemplate>(prefix);

    // Sort by category and name
    templates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return c.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET single template
chat.get('/templates/:id', async (c) => {
  try {
    const templateId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:template:${orgId}:${templateId}`;
    const template = await kv.get<MessageTemplate>(key);

    if (!template) {
      return c.json({ success: false, error: 'Template not found' }, 404);
    }

    return c.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// POST create template
chat.post('/templates', async (c) => {
  try {
    const body = await c.req.json();
    const {
      organization_id,
      name,
      name_en,
      name_es,
      content,
      content_en,
      content_es,
      category,
    } = body;

    if (!organization_id || !name || !content || !category) {
      return c.json({ 
        success: false, 
        error: 'organization_id, name, content, and category are required' 
      }, 400);
    }

    const templateId = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const template: MessageTemplate = {
      id: templateId,
      organization_id,
      name,
      name_en,
      name_es,
      content,
      content_en,
      content_es,
      category,
      created_at: now,
      updated_at: now,
    };

    const key = `chat:template:${organization_id}:${templateId}`;
    await kv.set(key, template);

    return c.json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH update template
chat.patch('/templates/:id', async (c) => {
  try {
    const templateId = c.req.param('id');
    const body = await c.req.json();
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de body.organization_id
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:template:${orgId}:${templateId}`;
    const template = await kv.get<MessageTemplate>(key);

    if (!template) {
      return c.json({ success: false, error: 'Template not found' }, 404);
    }

    const updated: MessageTemplate = {
      ...template,
      ...body,
      id: templateId,
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updated);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// DELETE template
chat.delete('/templates/:id', async (c) => {
  try {
    const templateId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:template:${orgId}:${templateId}`;
    await kv.del(key);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// TAGS
// ============================================

// GET all tags
chat.get('/tags', async (c) => {
  try {
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const prefix = `chat:tag:${orgId}:`;
    const tags = await kv.getByPrefix<ChatTag>(prefix);

    // Update conversations count for each tag
    const conversationsPrefix = `chat:conversation:${orgId}:`;
    const conversations = await kv.getByPrefix<Conversation>(conversationsPrefix);

    for (const tag of tags) {
      const count = conversations.filter(conv => 
        conv.tags?.includes(tag.id)
      ).length;
      tag.conversations_count = count;
    }

    // Sort by name
    tags.sort((a, b) => a.name.localeCompare(b.name));

    return c.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// POST create tag
chat.post('/tags', async (c) => {
  try {
    const body = await c.req.json();
    const {
      organization_id,
      name,
      color,
      description,
    } = body;

    if (!organization_id || !name || !color) {
      return c.json({ 
        success: false, 
        error: 'organization_id, name, and color are required' 
      }, 400);
    }

    const tagId = `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const tag: ChatTag = {
      id: tagId,
      organization_id,
      name,
      color,
      description,
      created_at: new Date().toISOString(),
      conversations_count: 0,
    };

    const key = `chat:tag:${organization_id}:${tagId}`;
    await kv.set(key, tag);

    return c.json({ success: true, data: tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PATCH update tag
chat.patch('/tags/:id', async (c) => {
  try {
    const tagId = c.req.param('id');
    const body = await c.req.json();
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de body.organization_id
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:tag:${orgId}:${tagId}`;
    const tag = await kv.get<ChatTag>(key);

    if (!tag) {
      return c.json({ success: false, error: 'Tag not found' }, 404);
    }

    const updated: ChatTag = {
      ...tag,
      ...body,
      id: tagId,
      organization_id: orgId,
    };

    await kv.set(key, updated);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// DELETE tag
chat.delete('/tags/:id', async (c) => {
  try {
    const tagId = c.req.param('id');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    // Remove tag from all conversations
    const conversationsPrefix = `chat:conversation:${orgId}:`;
    const conversations = await kv.getByPrefix<Conversation>(conversationsPrefix);

    for (const conversation of conversations) {
      if (conversation.tags?.includes(tagId)) {
        conversation.tags = conversation.tags.filter(t => t !== tagId);
        conversation.updated_at = new Date().toISOString();
        const convKey = `chat:conversation:${orgId}:${conversation.id}`;
        await kv.set(convKey, conversation);
      }
    }

    const key = `chat:tag:${orgId}:${tagId}`;
    await kv.del(key);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

// POST upload file
chat.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organization_id') as string;
    const conversationId = formData.get('conversation_id') as string;
    
    if (!file || !organizationId) {
      return c.json({ 
        success: false, 
        error: 'file and organization_id are required' 
      }, 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ 
        success: false, 
        error: 'File size exceeds 10MB limit' 
      }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const path = `${organizationId}/chat/${conversationId || 'general'}/${filename}`;

    // In production, upload to Supabase Storage
    // For now, we'll store metadata in KV and simulate upload
    const fileMetadata = {
      id: `file-${timestamp}`,
      filename: file.name,
      path,
      size: file.size,
      type: file.type,
      organization_id: organizationId,
      conversation_id: conversationId,
      uploaded_at: new Date().toISOString(),
      // In production, this would be the actual storage URL
      url: `/storage/${path}`,
    };

    // Store metadata in KV
    const key = `chat:file:${organizationId}:${fileMetadata.id}`;
    await kv.set(key, fileMetadata);

    return c.json({ 
      success: true, 
      data: fileMetadata 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET download file
chat.get('/files/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const key = `chat:file:${orgId}:${fileId}`;
    const fileMetadata = await kv.get(key);

    if (!fileMetadata) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    return c.json({ success: true, data: fileMetadata });
  } catch (error) {
    console.error('Error getting file:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET list files for conversation
chat.get('/conversations/:conversationId/files', async (c) => {
  try {
    const conversationId = c.req.param('conversationId');
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);

    const prefix = `chat:file:${orgId}:`;
    const allFiles = await kv.getByPrefix(prefix);
    
    // Filter files for this conversation
    const conversationFiles = allFiles.filter((file: any) => 
      file.conversation_id === conversationId
    );

    return c.json({ success: true, data: conversationFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// 🆕 CHANNELS CONFIGURATION (v1.0.101)
// ============================================

// GET channel configuration
// GET /channels/config - REMOVIDO: Esta rota antiga usava KV Store
// A rota correta está na linha 2312 e usa Supabase Database
// Deixando aqui como comentário para referência histórica

// UPDATE channel configuration
// ✅ REFATORADO v1.0.103.700 - Salva no Supabase Database ao invés de KV Store
chat.patch('/channels/config', async (c) => {
  try {
    const client = getSupabaseClient();
    
    const body = await c.req.json();
    console.log('📋 [PATCH /channels/config] Body completo recebido:', JSON.stringify(body, null, 2));
    
    // ✅ Obter organization_id: Tentar helper híbrido primeiro, fallback para body.organization_id
    let orgId: string | undefined;
    
    // Primeiro: Tentar usar organization_id do body (mais direto)
    if (body.organization_id) {
      const bodyOrgId = body.organization_id;
      console.log('📋 [PATCH /channels/config] organization_id do body:', bodyOrgId);
      
      // Verificar se é UUID válido
      const isUUID = bodyOrgId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID) {
        // É UUID válido - usar diretamente
        orgId = bodyOrgId;
        console.log('✅ [PATCH /channels/config] organization_id é UUID válido:', orgId);
      } else {
        // Não é UUID (ex: 'org_default') - buscar ou criar organização padrão
        console.log('⚠️ [PATCH /channels/config] organization_id não é UUID, buscando organização padrão:', bodyOrgId);
        
        try {
          // Tentar buscar na tabela organizations
          const { data: orgData, error: orgError } = await client
            .from('organizations')
            .select('id')
            .eq('legacy_imobiliaria_id', bodyOrgId)
            .maybeSingle();
          
          if (orgData?.id) {
            orgId = orgData.id;
            console.log('✅ [PATCH /channels/config] Organização encontrada:', orgId);
          } else if (orgError && orgError.code === '42P01') {
            // Tabela organizations não existe - criar UUID temporário fixo para org_default
            // ⚠️ ATENÇÃO: Em produção, isso deveria criar a organização real
            console.warn('⚠️ [PATCH /channels/config] Tabela organizations não existe, usando UUID fixo para org_default');
            orgId = '00000000-0000-0000-0000-000000000001'; // UUID fixo para org_default
          } else {
            // Tabela existe mas não encontrou - tentar criar
            console.log('⚠️ [PATCH /channels/config] Organização não encontrada, tentando criar...');
            try {
              const { data: newOrg, error: createError } = await client
                .from('organizations')
                .insert({
                  name: 'Organização Padrão',
                  slug: `org-${Date.now()}`,
                  email: 'admin@rendizy.com',
                  legacy_imobiliaria_id: bodyOrgId,
                  plan: 'free',
                  status: 'active'
                })
                .select('id')
                .single();
              
              if (newOrg?.id) {
                orgId = newOrg.id;
                console.log('✅ [PATCH /channels/config] Organização padrão criada:', orgId);
              } else {
                throw createError;
              }
            } catch (createError: any) {
              // Se criar falhar, usar UUID fixo como último recurso
              console.warn('⚠️ [PATCH /channels/config] Não foi possível criar organização, usando UUID fixo:', createError?.message);
              orgId = '00000000-0000-0000-0000-000000000001'; // UUID fixo para org_default
            }
          }
        } catch (queryError: any) {
          // Erro ao consultar - usar UUID fixo
          console.warn('⚠️ [PATCH /channels/config] Erro ao consultar organizations, usando UUID fixo:', queryError?.message);
          orgId = '00000000-0000-0000-0000-000000000001'; // UUID fixo para org_default
        }
      }
    }
    
    // Segundo: Tentar helper híbrido apenas se não tiver organization_id no body
    if (!orgId) {
      try {
        orgId = await getOrganizationIdOrThrow(c);
        console.log('✅ [PATCH /channels/config] organization_id obtido via helper:', orgId);
      } catch (error: any) {
        console.warn('⚠️ [PATCH /channels/config] Helper falhou:', error?.message);
        // Se não tiver no body nem no helper, usar UUID fixo como fallback
        orgId = '00000000-0000-0000-0000-000000000001';
        console.log('⚠️ [PATCH /channels/config] Usando UUID fixo como fallback');
      }
    }
    
    if (!orgId) {
      throw new Error('Não foi possível determinar organization_id. Configure no frontend ou vincule o usuário a uma organização.');
    }
    
    // ✅ GARANTIR que a organização existe antes de salvar (foreign key constraint)
    // Verificar se a organização existe, se não existir, criar ou buscar
    try {
      // Primeiro: verificar se organização existe
      const { data: existingOrg, error: checkError } = await client
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .maybeSingle();
      
      if (checkError?.code === '42P01') {
        // Tabela organizations não existe - não pode criar organização nem foreign key funciona
        console.warn('⚠️ [PATCH /channels/config] Tabela organizations não existe, continuando sem verificação...');
      } else if (checkError) {
        // Outro erro ao verificar
        console.error('❌ [PATCH /channels/config] Erro ao verificar organização:', checkError);
        throw new Error(`Erro ao verificar organização: ${checkError.message}`);
      } else if (!existingOrg) {
        // Organização não existe - buscar por legacy_imobiliaria_id ou criar
        console.log('⚠️ [PATCH /channels/config] Organização não existe, buscando/criando...', orgId);
        
        // Não encontrou - criar nova organização
        console.log('⚠️ [PATCH /channels/config] Criando nova organização...');
        
        try {
          // Usar UUID gerado automaticamente para evitar conflitos
          // Não usar legacy_imobiliaria_id pois pode não existir no banco
          const insertData: any = {
            // id será gerado automaticamente pelo banco (gen_random_uuid())
            name: 'Organização Padrão',
            slug: `org-default-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Garantir único
            email: `admin-${Date.now()}@rendizy.com`, // Email único
            plan: 'free',
            status: 'active'
          };
          
          // Tentar adicionar legacy_imobiliaria_id apenas se a coluna existir (não crítico)
          // Se não existir, o insert ainda funcionará sem esse campo
          const legacyId = body.organization_id || 'org_default';
          
          const { data: newOrg, error: createError } = await client
            .from('organizations')
            .insert(insertData)
            .select('id')
            .single();
          
          if (newOrg?.id) {
            orgId = newOrg.id;
            console.log('✅ [PATCH /channels/config] Organização criada com sucesso:', orgId);
            
            // Tentar atualizar com legacy_imobiliaria_id depois (se a coluna existir)
            try {
              await client
                .from('organizations')
                .update({ legacy_imobiliaria_id: legacyId })
                .eq('id', orgId);
              console.log('✅ [PATCH /channels/config] legacy_imobiliaria_id atualizado');
            } catch (updateError: any) {
              // Ignorar erro - coluna pode não existir, não é crítico
              console.warn('⚠️ [PATCH /channels/config] Não foi possível atualizar legacy_imobiliaria_id (ignorado):', updateError?.message);
            }
          } else {
            throw createError;
          }
        } catch (createError: any) {
          console.error('❌ [PATCH /channels/config] Erro ao criar organização:', createError);
          throw new Error(`Não foi possível criar organização. Erro: ${createError?.message || 'Unknown error'}. Verifique se a tabela organizations existe e tem as colunas corretas.`);
        }
      } else {
        console.log('✅ [PATCH /channels/config] Organização existe:', orgId);
      }
    } catch (orgCheckError: any) {
      // Re-lançar erros que já têm mensagem detalhada
      if (orgCheckError?.message?.includes('Não foi possível') || orgCheckError?.message?.includes('Erro ao')) {
        throw orgCheckError;
      }
      console.error('❌ [PATCH /channels/config] Erro inesperado ao verificar/criar organização:', orgCheckError);
      throw new Error(`Erro ao verificar/criar organização: ${orgCheckError?.message || 'Unknown error'}`);
    }
    
    console.log('📤 [PATCH /channels/config] Salvando config para org:', orgId);
    
    // ✅ FIX v1.0.103.950 - Usar Repository Pattern para garantir persistência
    // Preparar dados para salvar no banco
    const dbData: any = {
      organization_id: orgId,
    };
    
    // WhatsApp config
    if (body.whatsapp) {
      dbData.whatsapp_enabled = body.whatsapp.enabled ?? false;
      dbData.whatsapp_api_url = body.whatsapp.api_url || '';
      dbData.whatsapp_instance_name = body.whatsapp.instance_name || '';
      dbData.whatsapp_api_key = body.whatsapp.api_key || '';
      dbData.whatsapp_instance_token = body.whatsapp.instance_token || '';
      
      // Campos opcionais (preservar se já existirem)
      if (body.whatsapp.connected !== undefined) {
        dbData.whatsapp_connected = body.whatsapp.connected;
      }
      if (body.whatsapp.connection_status) {
        dbData.whatsapp_connection_status = body.whatsapp.connection_status;
      }
      if (body.whatsapp.phone_number) {
        dbData.whatsapp_phone_number = body.whatsapp.phone_number;
      }
      if (body.whatsapp.qr_code) {
        dbData.whatsapp_qr_code = body.whatsapp.qr_code;
      }
    }
    
    // SMS config
    if (body.sms) {
      dbData.sms_enabled = body.sms.enabled ?? false;
      dbData.sms_account_sid = body.sms.account_sid || '';
      dbData.sms_auth_token = body.sms.auth_token || '';
      dbData.sms_phone_number = body.sms.phone_number || '';
      if (body.sms.credits_used !== undefined) {
        dbData.sms_credits_used = body.sms.credits_used;
      }
    }
    
    // Automations
    if (body.automations) {
      dbData.automation_reservation_confirmation = body.automations.reservation_confirmation ?? false;
      dbData.automation_checkin_reminder = body.automations.checkin_reminder ?? false;
      dbData.automation_checkout_review = body.automations.checkout_review ?? false;
      dbData.automation_payment_reminder = body.automations.payment_reminder ?? false;
    }
    
    console.log('💾 [PATCH /channels/config] Dados para salvar:', {
      organization_id: dbData.organization_id,
      whatsapp_api_url: dbData.whatsapp_api_url || 'VAZIO',
      whatsapp_instance_name: dbData.whatsapp_instance_name || 'VAZIO',
      whatsapp_api_key: dbData.whatsapp_api_key ? `${dbData.whatsapp_api_key.substring(0, 10)}...` : 'VAZIO',
    });
    
    // ✅ FIX v1.0.103.950 - Usar Repository (UPSERT garante atomicidade)
    const result = await channelConfigRepository.upsert(dbData);
    
    if (!result.success) {
      console.error('❌ [PATCH /channels/config] Erro ao salvar via Repository:', result.error);
      return c.json(errorResponse(`Erro ao salvar configurações: ${result.error}`), 500);
    }
    
    if (!result.data) {
      console.error('❌ [PATCH /channels/config] Repository retornou success mas sem dados');
      return c.json(errorResponse('Erro ao salvar configurações: Dados não retornados'), 500);
    }
    
    savedData = result.data;
    console.log('✅✅ [PATCH /channels/config] Dados salvos e verificados via Repository:', {
      whatsapp_api_url: savedData.whatsapp_api_url || 'VAZIO',
      whatsapp_instance_name: savedData.whatsapp_instance_name || 'VAZIO',
      created_at: savedData.created_at
    });
    
    // Converter formato do banco para API (igual ao GET)
    const config = {
      organization_id: savedData.organization_id,
      whatsapp: {
        enabled: savedData.whatsapp_enabled ?? false,
        api_url: savedData.whatsapp_api_url || '',
        instance_name: savedData.whatsapp_instance_name || '',
        api_key: savedData.whatsapp_api_key || '',
        instance_token: savedData.whatsapp_instance_token || '',
        connected: savedData.whatsapp_connected ?? false,
        phone_number: savedData.whatsapp_phone_number || null,
        qr_code: savedData.whatsapp_qr_code || null,
        connection_status: savedData.whatsapp_connection_status || 'disconnected',
        last_connected_at: savedData.whatsapp_last_connected_at || null,
        error_message: savedData.whatsapp_error_message || null,
      },
      sms: {
        enabled: savedData.sms_enabled ?? false,
        account_sid: savedData.sms_account_sid || '',
        auth_token: savedData.sms_auth_token || '',
        phone_number: savedData.sms_phone_number || '',
        credits_used: savedData.sms_credits_used ?? 0,
        last_recharged_at: savedData.sms_last_recharged_at || null,
      },
      automations: {
        reservation_confirmation: savedData.automation_reservation_confirmation ?? false,
        checkin_reminder: savedData.automation_checkin_reminder ?? false,
        checkout_review: savedData.automation_checkout_review ?? false,
        payment_reminder: savedData.automation_payment_reminder ?? false,
      },
      created_at: savedData.created_at,
    };
    
    console.log('✅ [PATCH /channels/config] Configurações salvas com sucesso para org:', orgId);
    return c.json(successResponse(config));
  } catch (error) {
    console.error('❌ [PATCH /channels/config] Erro:', error);
    return c.json(errorResponse(
      error instanceof Error ? error.message : 'Erro desconhecido ao salvar configurações'
    ), 500);
  }
});

// ============================================
// 🆕 WHATSAPP (Evolution API) - v1.0.102 ✅
// ============================================

// ============================================================================
// HELPER FUNCTIONS - Channel Config (Database)
// ============================================================================

/**
 * Carrega configuração de canais do banco de dados
 */
async function loadChannelConfigFromDB(organizationId: string): Promise<OrganizationChannelConfig | null> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('organization_channel_config')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ [loadChannelConfigFromDB] Erro ao carregar:', error);
      return null;
    }
    
    if (!data) {
      console.log('⚠️ [loadChannelConfigFromDB] Nenhuma configuração encontrada para:', organizationId);
      return null;
    }
    
    // Converter formato do banco para formato da interface
    const config: OrganizationChannelConfig = {
      organization_id: data.organization_id,
      whatsapp: {
        enabled: data.whatsapp_enabled || false,
        api_url: data.whatsapp_api_url || '',
        instance_name: data.whatsapp_instance_name || '',
        api_key: data.whatsapp_api_key || '',
        instance_token: data.whatsapp_instance_token || '',
        connected: data.whatsapp_connected || false,
        phone_number: data.whatsapp_phone_number || undefined,
        qr_code: data.whatsapp_qr_code || undefined,
        connection_status: data.whatsapp_connection_status || 'disconnected',
        last_connected_at: data.whatsapp_last_connected_at || undefined,
        error_message: data.whatsapp_error_message || undefined,
      },
      sms: {
        enabled: data.sms_enabled || false,
        account_sid: data.sms_account_sid || '',
        auth_token: data.sms_auth_token || '',
        phone_number: data.sms_phone_number || '',
        credits_used: data.sms_credits_used || 0,
        last_recharged_at: data.sms_last_recharged_at || undefined,
      },
      automations: {
        reservation_confirmation: data.automation_reservation_confirmation || false,
        checkin_reminder: data.automation_checkin_reminder || false,
        checkout_review: data.automation_checkout_review || false,
        payment_reminder: data.automation_payment_reminder || false,
      },
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ [loadChannelConfigFromDB] Configuração carregada do banco para:', organizationId);
    return config;
  } catch (error) {
    console.error('❌ [loadChannelConfigFromDB] Erro:', error);
    return null;
  }
}

/**
 * Salva configuração de canais no banco de dados
 */
async function saveChannelConfigToDB(organizationId: string, config: Partial<OrganizationChannelConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    const dbData: any = {
      organization_id: organizationId,
    };
    
    // WhatsApp config
    if (config.whatsapp !== undefined) {
      if (typeof config.whatsapp === 'object') {
        dbData.whatsapp_enabled = config.whatsapp.enabled ?? false;
        dbData.whatsapp_api_url = config.whatsapp.api_url || '';
        dbData.whatsapp_instance_name = config.whatsapp.instance_name || '';
        dbData.whatsapp_api_key = config.whatsapp.api_key || '';
        dbData.whatsapp_instance_token = config.whatsapp.instance_token || '';
        dbData.whatsapp_connected = config.whatsapp.connected ?? false;
        dbData.whatsapp_phone_number = config.whatsapp.phone_number || null;
        dbData.whatsapp_qr_code = config.whatsapp.qr_code || null;
        dbData.whatsapp_connection_status = config.whatsapp.connection_status || 'disconnected';
        dbData.whatsapp_last_connected_at = config.whatsapp.last_connected_at || null;
        dbData.whatsapp_error_message = config.whatsapp.error_message || null;
      }
    }
    
    // SMS config
    if (config.sms !== undefined) {
      if (typeof config.sms === 'object') {
        dbData.sms_enabled = config.sms.enabled ?? false;
        dbData.sms_account_sid = config.sms.account_sid || '';
        dbData.sms_auth_token = config.sms.auth_token || '';
        dbData.sms_phone_number = config.sms.phone_number || '';
        dbData.sms_credits_used = config.sms.credits_used || 0;
        dbData.sms_last_recharged_at = config.sms.last_recharged_at || null;
      }
    }
    
    // Automations config
    if (config.automations !== undefined) {
      if (typeof config.automations === 'object') {
        dbData.automation_reservation_confirmation = config.automations.reservation_confirmation ?? false;
        dbData.automation_checkin_reminder = config.automations.checkin_reminder ?? false;
        dbData.automation_checkout_review = config.automations.checkout_review ?? false;
        dbData.automation_payment_reminder = config.automations.payment_reminder ?? false;
      }
    }
    
    // Verificar se já existe
    const { data: existing, error: checkError } = await client
      .from('organization_channel_config')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [saveChannelConfigToDB] Erro ao verificar:', checkError);
      return { success: false, error: checkError.message };
    }
    
    if (existing) {
      // UPDATE - importante: usar .select() para verificar se realmente atualizou
      const sanitizedPayload = sanitizeDbData(dbData, ['updated_at']);
      console.log('📝 [saveChannelConfigToDB] Payload de UPDATE:', {
        organization_id: sanitizedPayload.organization_id,
        whatsapp_api_url: sanitizedPayload.whatsapp_api_url || 'VAZIO',
        whatsapp_instance_name: sanitizedPayload.whatsapp_instance_name || 'VAZIO'
      });
      
      const { data: updatedData, error: updateError } = await client
        .from('organization_channel_config')
        .update(sanitizedPayload)
        .eq('organization_id', organizationId)
        .select('organization_id, whatsapp_api_url, whatsapp_instance_name, whatsapp_api_key, whatsapp_instance_token, created_at')
        .single();
      
      if (updateError) {
        console.error('❌ [saveChannelConfigToDB] Erro ao atualizar:', updateError);
        return { success: false, error: updateError.message };
      }
      
      if (!updatedData || !updatedData.organization_id) {
        console.error('❌ [saveChannelConfigToDB] UPDATE não retornou dados - nenhuma linha afetada!');
        return { success: false, error: 'UPDATE não afetou nenhuma linha - possivelmente bloqueado por RLS' };
      }
      
      console.log('✅ [saveChannelConfigToDB] Configuração atualizada no banco:', {
        whatsapp_api_url: updatedData.whatsapp_api_url || 'VAZIO',
        whatsapp_instance_name: updatedData.whatsapp_instance_name || 'VAZIO',
        created_at: updatedData.created_at
      });
    } else {
      // INSERT
      const { error: insertError } = await client
        .from('organization_channel_config')
        .insert(dbData);
      
      if (insertError) {
        console.error('❌ [saveChannelConfigToDB] Erro ao inserir:', insertError);
        return { success: false, error: insertError.message };
      }
      
      console.log('✅ [saveChannelConfigToDB] Configuração criada no banco');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ [saveChannelConfigToDB] Erro:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper: Create Evolution API client
function createEvolutionClient(config: EvolutionAPIConfig) {
  return {
    apiUrl: config.api_url,
    instanceName: config.instance_name,
    apiKey: config.api_key
  };
}

// Helper: Make request to Evolution API
async function evolutionRequest(
  config: { apiUrl: string; instanceName: string; apiKey: string },
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  // ✅ URL-encode instance name if present in endpoint
  const encodedEndpoint = endpoint.replace(
    /\/([\w\s]+)$/,
    (match, instanceName) => `/${encodeURIComponent(instanceName)}`
  );
  
  const url = `${config.apiUrl}${encodedEndpoint}`;
  
  console.log(`📡 Evolution API Request:`);
  console.log(`   Method: ${method}`);
  console.log(`   URL: ${url}`);
  console.log(`   API Key: ${config.apiKey.substring(0, 15)}...`);
  if (body) console.log(`   Body:`, JSON.stringify(body, null, 2));
  
  // Evolution API aceita múltiplos formatos de header de autenticação
  // Vamos enviar todos os formatos possíveis para garantir compatibilidade
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': config.apiKey,           // Formato padrão Evolution API v1
    'api-key': config.apiKey,          // Formato alternativo
    'Authorization': `Bearer ${config.apiKey}`, // Formato Bearer token
  };

  console.log(`   Headers:`, {
    'Content-Type': 'application/json',
    'apikey': `${config.apiKey.substring(0, 15)}...`,
    'api-key': `${config.apiKey.substring(0, 15)}...`,
    'Authorization': `Bearer ${config.apiKey.substring(0, 15)}...`
  });

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    // Log COMPLETO antes de enviar
    console.log(`🔍 DEBUGGING - Requisição COMPLETA:`);
    console.log(`   URL COMPLETA: ${url}`);
    console.log(`   Method: ${method}`);
    console.log(`   Headers COMPLETOS:`, JSON.stringify(headers, null, 2));
    console.log(`   API Key COMPLETA (ATENÇÃO LOGS):`, config.apiKey);
    if (body && method !== 'GET') {
      console.log(`   Body COMPLETO:`, JSON.stringify(body, null, 2));
    }
    
    const response = await fetch(url, options);
    
    console.log(`   Response Status: ${response.status} ${response.statusText}`);
    
    // ✅ Verificar content-type antes de processar
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
    
    if (!response.ok) {
      // Verificar se é HTML (erro comum)
      if (contentType && contentType.includes('text/html')) {
        console.error(`❌ Evolution API retornou HTML ao invés de JSON`);
        console.error(`   Possíveis causas:`);
        console.error(`   1. URL incorreta (verifique se não aponta para /manager)`);
        console.error(`   2. Endpoint não existe na sua versão da API`);
        console.error(`   3. Problema de autenticação (redirect para login)`);
        throw new Error(`Evolution API retornou HTML. Status: ${response.status}. Verifique a URL e credenciais.`);
      }
      
      const errorText = await response.text();
      console.error(`❌ Evolution API Error ${response.status}:`);
      console.error(`   Response:`, errorText);
      console.error(`   Headers enviados:`, headers);
      
      // Se 401, dar dica específica
      if (response.status === 401) {
        console.error(`❌ ERRO 401: API Key inválida ou formato incorreto`);
        console.error(`   API Key fornecida: ${config.apiKey.substring(0, 20)}...`);
        console.error(`   Confirme com seu TI se a API Key está correta`);
      }
      
      throw new Error(`Evolution API Error ${response.status}: ${errorText}`);
    }

    // ✅ Verificar se resposta é JSON antes de fazer parse
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error(`❌ Resposta não é JSON:`, responseText.substring(0, 200));
      throw new Error(`Evolution API retornou ${contentType} ao invés de JSON`);
    }

    const data = await response.json();
    console.log(`✅ Evolution API Success`);
    
    return data;
  } catch (error) {
    console.error(`❌ Evolution API Request Failed:`);
    console.error(`   URL: ${url}`);
    console.error(`   Error:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

// Connect WhatsApp instance
// ✅ REFATORADO v1.0.103.800 - Salva QR Code no Supabase Database ao invés de KV Store
chat.post('/channels/whatsapp/connect', async (c) => {
  try {
    const client = getSupabaseClient();
    const body = await c.req.json();
    let { api_url, instance_name, api_key, instance_token } = body;
    
    // ✅ Obter organization_id: Tentar helper híbrido primeiro, fallback para body.organization_id
    let orgId: string | undefined;
    try {
      orgId = await getOrganizationIdOrThrow(c);
      console.log('✅ [POST /channels/whatsapp/connect] organization_id obtido via helper:', orgId);
    } catch (error: any) {
      // Fallback: Usar organization_id do body se helper falhar
      if (body.organization_id) {
        const bodyOrgId = body.organization_id;
        console.log('⚠️ [POST /channels/whatsapp/connect] Helper falhou, usando organization_id do body:', bodyOrgId);
        
        // Verificar se é UUID válido
        const isUUID = bodyOrgId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isUUID) {
          orgId = bodyOrgId;
        } else {
          // Não é UUID - buscar ou criar organização padrão (mesma lógica do PATCH)
          console.log('⚠️ [POST /channels/whatsapp/connect] organization_id não é UUID, buscando/criando organização...');
          
          // Buscar por legacy_imobiliaria_id ou criar
          const { data: foundOrg } = await client
            .from('organizations')
            .select('id')
            .eq('legacy_imobiliaria_id', bodyOrgId)
            .maybeSingle();
          
          if (foundOrg?.id) {
            orgId = foundOrg.id;
          } else {
            // Criar nova organização
            const { data: newOrg, error: createError } = await client
              .from('organizations')
              .insert({
                name: 'Organização Padrão',
                slug: `org-default-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                email: `admin-${Date.now()}@rendizy.com`,
                plan: 'free',
                status: 'active'
              })
              .select('id')
              .single();
            
            if (newOrg?.id) {
              orgId = newOrg.id;
            } else {
              throw new Error(`Não foi possível criar organização: ${createError?.message || 'Unknown error'}`);
            }
          }
        }
      } else {
        throw new Error('Não foi possível determinar organization_id. Configure no frontend ou vincule o usuário a uma organização.');
      }
    }
    
    if (!orgId) {
      return c.json({ 
        success: false, 
        error: 'Não foi possível determinar organization_id' 
      }, 400);
    }
    
    if (!api_url || !instance_name || !api_key) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: api_url, instance_name, api_key' 
      }, 400);
    }

    // Limpar e validar dados
    api_url = api_url.trim().replace(/\/manager\/?$/, '').replace(/\/$/, '');
    instance_name = instance_name.trim();
    api_key = api_key.trim();
    
    // Validar URL
    if (api_url === 'https://api.evolutionapi.com' || !api_url.startsWith('http')) {
      return c.json({
        success: false,
        error: 'Invalid Evolution API URL. Please use your real server URL (without /manager)'
      }, 400);
    }
    
    // Validar API Key
    if (!api_key || api_key.length < 10) {
      return c.json({
        success: false,
        error: 'Invalid API Key'
      }, 400);
    }

    console.log(`🔗 Connecting WhatsApp for org: ${orgId}`);
    console.log(`📡 API URL: ${api_url}`);
    console.log(`📱 Instance: ${instance_name}`);

    const evolutionClient = { apiUrl: api_url, instanceName: instance_name, apiKey: api_key };

    // ============================================
    // 🆕 v1.0.103.61: DELETE + RECREATE Strategy
    // ============================================
    // Step 1: Check if instance exists
    let instanceExists = false;
    
    try {
      const       instanceInfo = await evolutionRequest(
        evolutionClient,
        `/instance/connectionState/${instance_name}`,
        'GET'
      );
      instanceExists = true;
      console.log('✅ Instance already exists');
      console.log('   Full instance info:', JSON.stringify(instanceInfo, null, 2));
    } catch (error) {
      console.log('📝 Instance does not exist yet.');
      instanceExists = false;
    }

    // Step 2: DELETE instance completely (if exists)
    if (instanceExists) {
      try {
        console.log('🗑️  DELETING existing instance to force fresh QR Code generation...');
        
        await evolutionRequest(
          evolutionClient,
          `/instance/delete/${instance_name}`,
          'DELETE'
        );
        
        console.log('✅ Instance deleted successfully');
        
        // IMPORTANTE: Aguardar Evolution API processar
        console.log('⏳ Waiting 2 seconds for Evolution API to process deletion...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (deleteError) {
        console.error('❌ Error deleting instance:', deleteError);
        
        // Fallback: Tentar logout
        try {
          console.log('🔄 Trying logout as fallback...');
          await evolutionRequest(evolutionClient, `/instance/logout/${instance_name}`, 'DELETE');
          console.log('✅ Logout successful');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (logoutError) {
          console.error('❌ Logout also failed:', logoutError);
        }
      }
    }

    // Step 3: CREATE new instance explicitly
    let instanceCreated = false;
    try {
      console.log('🆕 Creating NEW instance...');
      
      const createResponse = await evolutionRequest(
        evolutionClient,
        `/instance/create`,
        'POST',
        {
          instanceName: instance_name,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }
      );
      
      console.log('✅ New instance created successfully');
      console.log('   Create response:', JSON.stringify(createResponse, null, 2));
      instanceCreated = true;
      
      // ✅ Aguardar instância ficar pronta (Evolution API precisa de tempo para provisionar)
      console.log('⏳ Aguardando 5 segundos para instância ser provisionada...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (createError: any) {
      console.error('❌ Error creating instance:', createError);
      
      // Se erro 401, a API Key está inválida - retornar erro estruturado
      if (createError.message?.includes('401') || createError.message?.includes('Unauthorized')) {
        console.error('🔴 API Key inválida - retornando erro estruturado para frontend');
        
        return c.json({
          success: false,
          error: 'API_KEY_INVALID',
          message: 'A API Key fornecida não é válida ou não tem permissões.',
          details: {
            code: 'INVALID_CREDENTIALS',
            action: 'OBTAIN_VALID_API_KEY',
            steps: [
              'Acesse: https://evo.boravendermuito.com.br/manager',
              'Menu: Global API Keys',
              'Criar nova key com TODAS permissões',
              'Colar no RENDIZY e testar'
            ]
          }
        }, 401);
      }
      
      // Se erro 409 ou mensagem dizendo que já existe, continuar
      if (createError.message?.includes('409') || createError.message?.includes('already exists')) {
        console.log('   Instance already exists, continuing...');
        instanceCreated = true;
      } else {
        console.log('   Will try to connect anyway...');
      }
    }
    
    // Se não conseguiu criar e não existe, não tem como continuar
    if (!instanceCreated && !instanceExists) {
      throw new Error('Failed to create instance. Please check your Evolution API credentials and permissions.');
    }

    // Step 4: Check current connection status
    let connectionStatus;
    try {
      console.log('📡 Checking current connection status...');
      connectionStatus = await evolutionRequest(
        evolutionClient,
        `/instance/connectionState/${instance_name}`,
        'GET'
      );
      console.log('✅ Connection status:', JSON.stringify(connectionStatus, null, 2));
    } catch (statusError: any) {
      console.error('⚠️ Error checking status (continuing anyway):', statusError);
      connectionStatus = { state: 'close' };
    }

    // Step 5: If already connected, logout first to generate new QR
    if (connectionStatus?.instance?.state === 'open' || connectionStatus?.state === 'open') {
      console.log('⚠️ Instance already connected. Logging out to generate new QR...');
      try {
        await evolutionRequest(
          evolutionClient,
          `/instance/logout/${instance_name}`,
          'DELETE'
        );
        console.log('✅ Successfully logged out');
        // Wait for logout to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (logoutError: any) {
        console.error('⚠️ Error during logout (continuing anyway):', logoutError);
      }
    }

    // Step 6: Generate FRESH QR Code
    // Tentativa 1: Usar /instance/connect
    let qrCodeData;
    let qrCodeBase64TempTry1 = null;
    
    try {
      console.log('📡 [Attempt 1] Requesting QR Code via /instance/connect...');
      qrCodeData = await evolutionRequest(
        evolutionClient,
        `/instance/connect/${instance_name}`,
        'GET'
      );
      console.log('✅ [Attempt 1] QR Code response received');
      console.log('   Full response:', JSON.stringify(qrCodeData, null, 2));
      
      // Tentar extrair QR code
      qrCodeBase64TempTry1 = 
        qrCodeData?.base64 || 
        qrCodeData?.code || 
        qrCodeData?.qrcode?.base64 ||
        qrCodeData?.qrcode?.code ||
        qrCodeData?.pairingCode;
        
    } catch (qrError: any) {
      console.error('⚠️ [Attempt 1] Failed:', qrError.message);
      qrCodeData = null;
    }
    
    // Se falhou, tentar método alternativo
    if (!qrCodeBase64TempTry1) {
      console.log('📡 [Attempt 2] Waiting longer and trying connectionState...');
      
      try {
        // Aguardar a instância processar (Evolution API precisa de tempo)
        console.log('⏳ Aguardando 5 segundos para instância ficar pronta...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Buscar status que pode conter o QR
        const statusData = await evolutionRequest(
          evolutionClient,
          `/instance/connectionState/${instance_name}`,
          'GET'
        );
        console.log('✅ [Attempt 2] Status fetched:', JSON.stringify(statusData, null, 2));
        
        // Tentar extrair QR do status
        qrCodeData = statusData;
        
      } catch (retryError: any) {
        console.error('⚠️ [Attempt 2] Failed:', retryError.message);
        
        // Última tentativa: erro estruturado
        let errorMsg = 'Failed to generate QR Code after multiple attempts. ';
        
        if (retryError.message?.includes('404')) {
          errorMsg += 'The instance does not exist. ';
          if (!instanceCreated) {
            errorMsg += 'Instance creation failed - please check your API Key permissions.';
          } else {
            errorMsg += 'The instance was just created but not found - there may be a delay. Try again in a few seconds.';
          }
        } else if (retryError.message?.includes('401')) {
          errorMsg += 'API Key is invalid or does not have permission to connect instances.';
        } else {
          errorMsg += 'There may be a connection issue with Evolution API. Error: ' + retryError.message;
        }
        
        throw new Error(errorMsg);
      }
    }

    // Extract QR Code from response (can be in different formats)
    // Evolution API pode retornar em vários formatos diferentes:
    // 1. { base64: "data:image/png;base64,..." }
    // 2. { code: "data:image/png;base64,..." }
    // 3. { qrcode: { base64: "...", code: "..." } }
    // 4. { pairingCode: "..." } (para conexão por código)
    // 5. { instance: { qrcode: { base64: "..." } } } (quando vem do status)
    let qrCodeBase64 = 
      qrCodeBase64TempTry1 ||
      qrCodeData?.base64 || 
      qrCodeData?.code || 
      qrCodeData?.qrcode?.base64 ||
      qrCodeData?.qrcode?.code ||
      qrCodeData?.instance?.qrcode?.base64 ||
      qrCodeData?.instance?.qrcode?.code ||
      qrCodeData?.pairingCode;
    
    // Log what we got
    console.log('📊 QR Code extraction:');
    console.log('   base64:', qrCodeData?.base64 ? `${qrCodeData.base64.substring(0, 30)}...` : 'undefined');
    console.log('   code:', qrCodeData?.code ? `${qrCodeData.code.substring(0, 30)}...` : 'undefined');
    console.log('   qrcode.base64:', qrCodeData?.qrcode?.base64 ? `${qrCodeData.qrcode.base64.substring(0, 30)}...` : 'undefined');
    console.log('   qrcode.code:', qrCodeData?.qrcode?.code ? `${qrCodeData.qrcode.code.substring(0, 30)}...` : 'undefined');
    console.log('   instance.qrcode.base64:', qrCodeData?.instance?.qrcode?.base64 ? `${qrCodeData.instance.qrcode.base64.substring(0, 30)}...` : 'undefined');
    console.log('   pairingCode:', qrCodeData?.pairingCode ? `${qrCodeData.pairingCode.substring(0, 30)}...` : 'undefined');
    console.log('   from Try1:', qrCodeBase64TempTry1 ? `${qrCodeBase64TempTry1.substring(0, 30)}...` : 'undefined');
    console.log('   Final QR Code:', qrCodeBase64 ? `${qrCodeBase64.substring(0, 30)}...` : 'undefined');
    
    // Se ainda não encontrou o QR code, tentar uma última alternativa
    if (!qrCodeBase64) {
      console.log('📡 [Attempt 3] Trying /manager/instance/connectionState endpoint...');
      
      try {
        // Usar endpoint /manager que pode ter estrutura diferente
        const managerResponse = await fetch(
          `${api_url}/manager/instance/connectionState/${instance_name}`,
          {
            method: 'GET',
            headers: {
              'apikey': api_key,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          console.log('✅ [Attempt 3] Manager response:', JSON.stringify(managerData, null, 2));
          
          qrCodeBase64 = 
            managerData?.instance?.qrcode?.base64 ||
            managerData?.instance?.qrcode?.code ||
            managerData?.qrcode?.base64 ||
            managerData?.qrcode?.code ||
            managerData?.base64 ||
            managerData?.code;
        }
      } catch (managerError: any) {
        console.error('⚠️ [Attempt 3] Manager endpoint failed:', managerError.message);
      }
    }
    
    // Verificação final
    if (!qrCodeBase64) {
      console.error('❌ No QR Code found after all attempts. Full response:', qrCodeData);
      
      // Se a resposta é { count: 0 }, significa que não há QR code disponível
      // Isso pode acontecer se a instância já está conectada ou em estado transitório
      if (qrCodeData?.count === 0) {
        throw new Error('QR Code not available. The Evolution API returned "count: 0" which usually means the instance is already connected. Try disconnecting first and then reconnecting.');
      }
      
      if (typeof qrCodeData === 'object' && Object.keys(qrCodeData).length === 0) {
        throw new Error('QR Code not available. The Evolution API returned an empty response. This may indicate a configuration issue or the instance is in a transitional state.');
      }
      
      throw new Error('QR Code not found in Evolution API response after multiple attempts. The API may be returning an unexpected format. Check the server logs for the full response.');
    }

    // ✅ Step 3: Save configuration to Supabase Database
    console.log('💾 Salvando configuração e QR Code no banco...');
    
    const dbData: any = {
      organization_id: orgId,
      whatsapp_enabled: true,
      whatsapp_api_url: api_url,
      whatsapp_instance_name: instance_name,
      whatsapp_api_key: api_key,
      whatsapp_connected: false,
      whatsapp_connection_status: 'connecting',
      whatsapp_qr_code: qrCodeBase64,
      updated_at: new Date().toISOString(),
    };
    
    // Salvar instance_token se fornecido
    if (instance_token) {
      dbData.whatsapp_instance_token = instance_token.trim();
    }
    
    const { error: upsertError } = await safeUpsert(
      client,
      'organization_channel_config',
      dbData,
      'organization_id'
    );
    
    if (upsertError) {
      console.error('❌ Erro ao salvar configuração no banco:', upsertError);
      throw new Error(`Erro ao salvar configuração: ${upsertError.message}`);
    }

    console.log('✅ WhatsApp connection initiated successfully');
    console.log('✅ QR Code saved to database');

    return c.json({ 
      success: true, 
      data: {
        qr_code: qrCodeBase64,
        instance_name,
        status: 'connecting'
      }
    });
  } catch (error) {
    console.error('❌ Error connecting WhatsApp:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Get WhatsApp connection status
// ✅ REFATORADO v1.0.103.900 - Usa banco de dados ao invés de KV Store
chat.post('/channels/whatsapp/status', async (c) => {
  try {
    const body = await c.req.json();
    const { organization_id } = body;
    
    if (!organization_id) {
      return c.json({ success: false, error: 'organization_id is required' }, 400);
    }

    // ✅ Carregar config do banco de dados
    const config = await loadChannelConfigFromDB(organization_id);
    
    if (!config?.whatsapp || !config.whatsapp.enabled) {
      return c.json({ 
        success: true, 
        data: { connected: false, error: 'WhatsApp not configured' } 
      });
    }

    // Check status from Evolution API
    try {
      const client = createEvolutionClient(config.whatsapp);
      const instanceInfo = await evolutionRequest(
        client,
        `/instance/connectionState/${config.whatsapp.instance_name}`,
        'GET'
      );

      const isConnected = instanceInfo.instance?.status === 'open';
      const phoneNumber = instanceInfo.phoneNumber || 
                         (instanceInfo.ownerJid ? instanceInfo.ownerJid.split('@')[0] : undefined);

      // Update config if status changed
      if (isConnected !== config.whatsapp.connected) {
        const updateResult = await saveChannelConfigToDB(organization_id, {
          whatsapp: {
            ...config.whatsapp,
            connected: isConnected,
            connection_status: isConnected ? 'connected' : 'disconnected',
            phone_number: phoneNumber,
            last_connected_at: isConnected ? new Date().toISOString() : config.whatsapp.last_connected_at,
          }
        });
        
        if (!updateResult.success) {
          console.error('❌ [WhatsApp Status] Erro ao salvar status atualizado:', updateResult.error);
        }
      }

      return c.json({ 
        success: true, 
        data: {
          connected: isConnected,
          phone_number: phoneNumber,
          connection_status: isConnected ? 'connected' : (config.whatsapp.connection_status || 'disconnected'),
          profile_name: instanceInfo.profileName
        }
      });
    } catch (error) {
      console.error('❌ Error checking Evolution API status:', error);
      
      // Return cached status from database
      return c.json({ 
        success: true, 
        data: {
          connected: config.whatsapp.connected || false,
          phone_number: config.whatsapp.phone_number,
          connection_status: config.whatsapp.connection_status || 'error',
          error: 'Could not connect to Evolution API'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error getting WhatsApp status:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Disconnect WhatsApp
// ✅ REFATORADO v1.0.103.900 - Usa banco de dados ao invés de KV Store
chat.post('/channels/whatsapp/disconnect', async (c) => {
  try {
    const body = await c.req.json();
    const { organization_id } = body;
    
    if (!organization_id) {
      return c.json({ success: false, error: 'organization_id is required' }, 400);
    }

    // ✅ Carregar config do banco de dados
    const config = await loadChannelConfigFromDB(organization_id);
    
    if (!config?.whatsapp) {
      return c.json({ success: false, error: 'WhatsApp not configured' }, 400);
    }

    // Logout from Evolution API
    try {
      const client = createEvolutionClient(config.whatsapp);
      await evolutionRequest(
        client,
        `/instance/logout/${config.whatsapp.instance_name}`,
        'DELETE'
      );
      console.log('✅ WhatsApp logged out successfully');
    } catch (error) {
      console.error('⚠️ Error logging out from Evolution API:', error);
      // Continue anyway to update local state
    }

    // ✅ Atualizar config no banco de dados
    const updateResult = await saveChannelConfigToDB(organization_id, {
      whatsapp: {
        ...config.whatsapp,
        connected: false,
        connection_status: 'disconnected',
        phone_number: undefined,
        qr_code: undefined,
      }
    });
    
    if (!updateResult.success) {
      console.error('❌ [WhatsApp Disconnect] Erro ao salvar desconexão:', updateResult.error);
      return c.json({ 
        success: false, 
        error: `Erro ao salvar desconexão: ${updateResult.error}` 
      }, 500);
    }

    return c.json({ success: true, data: { connected: false } });
  } catch (error) {
    console.error('❌ Error disconnecting WhatsApp:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Send WhatsApp message
// ✅ REFATORADO v1.0.103.900 - Usa banco de dados ao invés de KV Store
chat.post('/channels/whatsapp/send', async (c) => {
  try {
    const body = await c.req.json();
    const { organization_id, conversation_id, content, metadata, phone_number } = body;
    
    if (!organization_id || !conversation_id || !content) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: organization_id, conversation_id, content' 
      }, 400);
    }

    // ✅ Carregar config do banco de dados
    const config = await loadChannelConfigFromDB(organization_id);
    
    if (!config?.whatsapp || !config.whatsapp.enabled) {
      return c.json({ success: false, error: 'WhatsApp not configured' }, 400);
    }

    if (!config.whatsapp.connected) {
      return c.json({ success: false, error: 'WhatsApp not connected' }, 400);
    }

    // Get conversation to find phone number
    const conversation = await kv.get<Conversation>(`chat:conversation:${organization_id}:${conversation_id}`);
    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    const targetPhone = phone_number || conversation.guest_phone;
    if (!targetPhone) {
      return c.json({ success: false, error: 'Phone number not found' }, 400);
    }

    // Normalize phone number
    const normalizePhone = (num: string) => {
      let normalized = num.replace(/\D/g, '');
      if (!normalized.startsWith('55') && normalized.length === 11) {
        normalized = '55' + normalized;
      }
      if (!num.includes('@s.whatsapp.net')) {
        normalized = `${normalized}@s.whatsapp.net`;
      } else {
        normalized = num;
      }
      return normalized;
    };

    const client = createEvolutionClient(config.whatsapp);
    
    // Send message via Evolution API
    let evolutionResponse;
    if (metadata?.media_url) {
      // Send media
      evolutionResponse = await evolutionRequest(
        client,
        `/message/sendMedia/${config.whatsapp.instance_name}`,
        'POST',
        {
          number: normalizePhone(targetPhone),
          mediatype: metadata.media_type || 'image',
          media: metadata.media_url,
          caption: content || '',
          fileName: metadata.file_name || 'file'
        }
      );
    } else {
      // Send text
      evolutionResponse = await evolutionRequest(
        client,
        `/message/sendText/${config.whatsapp.instance_name}`,
        'POST',
        {
          number: normalizePhone(targetPhone),
          text: content
        }
      );
    }

    // Create message in our system
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message: Message = {
      id: messageId,
      conversation_id,
      sender_type: 'staff',
      sender_name: 'Sistema',
      content,
      sent_at: new Date().toISOString(),
      organization_id,
      attachments: metadata?.media_url ? [metadata.media_url] : [],
      channel: 'whatsapp',
      direction: 'outgoing',
      external_id: evolutionResponse.key?.id,
      external_status: 'sent',
      metadata: {
        whatsapp_message_id: evolutionResponse.key?.id,
        media_url: metadata?.media_url,
        media_type: metadata?.media_type,
        media_caption: content
      }
    };

    // Save message
    await kv.set(`chat:message:${organization_id}:${conversation_id}:${messageId}`, message);

    // Update conversation
    conversation.last_message = content;
    conversation.last_message_at = new Date().toISOString();
    conversation.last_channel = 'whatsapp';
    conversation.updated_at = new Date().toISOString();
    await kv.set(`chat:conversation:${organization_id}:${conversation_id}`, conversation);

    console.log('✅ WhatsApp message sent successfully');

    return c.json({ success: true, data: message });
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Webhook to receive WhatsApp messages (from Evolution API)
chat.post('/channels/whatsapp/webhook', async (c) => {
  try {
    const payload = await c.req.json();
    
    console.log('📥 WhatsApp webhook received:', JSON.stringify(payload, null, 2));

    // Only process incoming messages
    if (payload.event !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
      console.log('⏭️ Skipping non-message event:', payload.event);
      return c.json({ success: true, message: 'Event ignored' });
    }

    const messageData = payload.data;
    
    // Skip messages sent by us
    if (messageData.key?.fromMe) {
      console.log('⏭️ Skipping outgoing message');
      return c.json({ success: true, message: 'Outgoing message ignored' });
    }

    // Extract message info
    const senderJid = messageData.key?.remoteJid;
    const messageId = messageData.key?.id;
    const senderPhone = senderJid?.split('@')[0] || '';
    const senderName = messageData.pushName || `+${senderPhone}`;
    
    // Extract text from different message types
    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    } else if (messageData.message?.imageMessage?.caption) {
      messageText = messageData.message.imageMessage.caption || '📷 Image';
    } else if (messageData.message?.videoMessage?.caption) {
      messageText = messageData.message.videoMessage.caption || '🎥 Video';
    } else if (messageData.message?.audioMessage) {
      messageText = '🎵 Audio';
    } else if (messageData.message?.documentMessage) {
      messageText = '📄 Document';
    }

    if (!messageText) {
      console.log('⚠️ Could not extract message text');
      return c.json({ success: true, message: 'No text found' });
    }

    // ✅ Find organization by instance name - Buscar do banco de dados
    const instanceName = payload.instance;
    const client = getSupabaseClient();
    
    // Buscar todas as configurações que têm WhatsApp habilitado
    const { data: allConfigs, error: fetchError } = await client
      .from('organization_channel_config')
      .select('*')
      .eq('whatsapp_enabled', true)
      .not('whatsapp_instance_name', 'is', null);
    
    if (fetchError) {
      console.error('❌ [Webhook] Erro ao buscar configurações:', fetchError);
      return c.json({ success: false, error: 'Erro ao buscar configurações' }, 500);
    }
    
    // Converter para formato da interface e encontrar por instance_name
    const orgConfig = allConfigs
      ?.map(data => {
        try {
          return {
            organization_id: data.organization_id,
            whatsapp: {
              enabled: data.whatsapp_enabled || false,
              api_url: data.whatsapp_api_url || '',
              instance_name: data.whatsapp_instance_name || '',
              api_key: data.whatsapp_api_key || '',
              instance_token: data.whatsapp_instance_token || '',
              connected: data.whatsapp_connected || false,
              phone_number: data.whatsapp_phone_number || undefined,
              qr_code: data.whatsapp_qr_code || undefined,
              connection_status: data.whatsapp_connection_status || 'disconnected',
              last_connected_at: data.whatsapp_last_connected_at || undefined,
              error_message: data.whatsapp_error_message || undefined,
            },
          } as OrganizationChannelConfig;
        } catch {
          return null;
        }
      })
      .find(cfg => cfg?.whatsapp?.instance_name === instanceName) || null;
    
    if (!orgConfig) {
      console.error('❌ [Webhook] Organization not found for instance:', instanceName);
      return c.json({ success: false, error: 'Organization not found' }, 404);
    }

    const organizationId = orgConfig.organization_id;
    console.log(`✅ Found organization: ${organizationId}`);

    // Find or create conversation
    const conversationsPrefix = `chat:conversation:${organizationId}:`;
    const allConversations = await kv.getByPrefix<Conversation>(conversationsPrefix);
    
    let conversation = allConversations.find(conv => 
      conv.guest_phone?.replace(/\D/g, '').includes(senderPhone) ||
      conv.channel_metadata?.whatsapp_contact_id === senderJid
    );

    if (!conversation) {
      // Create new conversation
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      conversation = {
        id: conversationId,
        organization_id: organizationId,
        guest_name: senderName,
        guest_email: '',
        guest_phone: `+${senderPhone}`,
        channel: 'whatsapp',
        status: 'unread',
        category: 'normal',
        conversation_type: 'guest',
        last_message: messageText,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        external_conversation_id: senderJid,
        last_channel: 'whatsapp',
        channel_metadata: {
          whatsapp_contact_id: senderJid
        }
      };
      
      await kv.set(`chat:conversation:${organizationId}:${conversationId}`, conversation);
      console.log(`✅ Created new conversation: ${conversationId}`);
    } else {
      // Update existing conversation
      conversation.last_message = messageText;
      conversation.last_message_at = new Date().toISOString();
      conversation.last_channel = 'whatsapp';
      conversation.status = 'unread';
      conversation.updated_at = new Date().toISOString();
      
      await kv.set(`chat:conversation:${organizationId}:${conversation.id}`, conversation);
      console.log(`✅ Updated conversation: ${conversation.id}`);
    }

    // Create message
    const newMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id: newMessageId,
      conversation_id: conversation.id,
      sender_type: 'guest',
      sender_name: senderName,
      content: messageText,
      sent_at: new Date(messageData.messageTimestamp * 1000).toISOString(),
      organization_id: organizationId,
      attachments: [],
      channel: 'whatsapp',
      direction: 'incoming',
      external_id: messageId,
      external_status: 'delivered',
      metadata: {
        whatsapp_message_id: messageId,
        media_type: messageData.messageType
      }
    };

    await kv.set(
      `chat:message:${organizationId}:${conversation.id}:${newMessageId}`,
      newMessage
    );

    console.log('✅ WhatsApp message processed successfully');

    return c.json({ 
      success: true, 
      message: 'Message processed',
      data: {
        conversation_id: conversation.id,
        message_id: newMessageId
      }
    });
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// 🆕 CHANNEL CONFIGURATION - v1.0.103+
// Salva no Supabase Database (tabela organization_channel_config)
// ============================================

// Get channel configuration (WhatsApp, SMS, etc)
// ✅ REFATORADO v1.0.103.900 - Aceita organization_id do query param com fallback para helper híbrido
chat.get('/channels/config', async (c) => {
  try {
    const client = getSupabaseClient();
    
    // ✅ Obter organization_id: Tentar helper híbrido primeiro, fallback para query param
    let organizationId: string | undefined;
    
    // Primeiro: Tentar usar organization_id do query param (para compatibilidade com frontend)
    const queryOrgId = c.req.query('organization_id');
    if (queryOrgId) {
      console.log('📋 [GET /channels/config] organization_id do query param:', queryOrgId);
      
      // Verificar se é UUID válido
      const isUUID = queryOrgId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID) {
        // É UUID válido
        organizationId = queryOrgId;
        console.log('✅ [GET /channels/config] organization_id é UUID válido:', organizationId);
      } else {
        // Não é UUID - pode ser 'org_default', buscar organização padrão
        console.log('⚠️ [GET /channels/config] organization_id não é UUID, buscando organização padrão...', queryOrgId);
        
        // IMPORTANTE: PRIORIZAR buscar organização que já tem config salva (mais importante!)
        // Isso garante que sempre usamos a mesma organização que foi usada para salvar
        try {
          // Estratégia 1 (PRIORIDADE): Buscar organização que já tem config salva
          const { data: configData, error: configError } = await client
            .from('organization_channel_config')
            .select('organization_id')
            .limit(1)
            .maybeSingle()
            .catch(() => ({ data: null, error: null }));
          
          if (configData?.organization_id) {
            organizationId = configData.organization_id;
            console.log('✅ [GET /channels/config] Usando organization_id da config existente:', organizationId);
          } else {
            // Estratégia 2: Buscar por legacy_imobiliaria_id
            let foundOrg: any = null;
            try {
              const { data } = await client
                .from('organizations')
                .select('id')
                .eq('legacy_imobiliaria_id', queryOrgId)
                .maybeSingle();
              foundOrg = data;
            } catch (err) {
              // Coluna pode não existir, ignorar
            }
            
            if (foundOrg?.id) {
              organizationId = foundOrg.id;
              console.log('✅ [GET /channels/config] Organização encontrada por legacy_imobiliaria_id:', organizationId);
            } else {
              // Estratégia 3: Buscar primeira organização disponível
              const { data: firstOrg } = await client
                .from('organizations')
                .select('id')
                .limit(1)
                .maybeSingle()
                .catch(() => ({ data: null }));
              
              if (firstOrg?.id) {
                organizationId = firstOrg.id;
                console.log('✅ [GET /channels/config] Usando primeira organização disponível:', organizationId);
              } else {
                // Última opção: Criar organização padrão
                const { data: newOrg } = await client
                  .from('organizations')
                  .insert({
                    name: 'Organização Padrão',
                    slug: `org-${Date.now()}`,
                    email: 'admin@rendizy.com',
                    plan: 'free',
                    status: 'active'
                  })
                  .select('id')
                  .single()
                  .catch(() => null);
                
                if (newOrg?.id) {
                  organizationId = newOrg.id;
                  console.log('✅ [GET /channels/config] Organização padrão criada:', organizationId);
                  
                  // Tentar atualizar com legacy_imobiliaria_id (ignora erro se coluna não existir)
                  await client
                    .from('organizations')
                    .update({ legacy_imobiliaria_id: queryOrgId })
                    .eq('id', organizationId)
                    .catch(() => null);
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ [GET /channels/config] Erro ao buscar/criar organização padrão:', error);
        }
      }
    }
    
    // Segundo: Se não conseguiu do query param, tentar helper híbrido
    if (!organizationId) {
      try {
        organizationId = await getOrganizationIdOrThrow(c);
        console.log('✅ [GET /channels/config] organization_id obtido via helper:', organizationId);
      } catch (error) {
        console.warn('⚠️ [GET /channels/config] Helper falhou, tentando criar organização padrão...', error);
        
        // Fallback final: usar UUID fixo para org_default (mesma lógica do PATCH)
        try {
          const { data: newOrg } = await client
            .from('organizations')
            .insert({
              name: 'Organização Padrão',
              slug: `org-${Date.now()}`,
              email: 'admin@rendizy.com',
              plan: 'free',
              status: 'active'
            })
            .select('id')
            .single()
            .catch(() => null);
          
          if (newOrg?.id) {
            organizationId = newOrg.id;
            console.log('✅ [GET /channels/config] Organização padrão criada (fallback):', organizationId);
          } else {
            // Último recurso: usar UUID fixo
            organizationId = '00000000-0000-0000-0000-000000000001';
            console.warn('⚠️ [GET /channels/config] Usando UUID fixo como último recurso:', organizationId);
          }
        } catch (error) {
          console.error('❌ [GET /channels/config] Erro ao criar organização padrão:', error);
          // Não retornar erro aqui - continuar e usar UUID fixo como fallback
        }
      }
    }

    // Última tentativa: usar UUID fixo para org_default
    if (!organizationId) {
      console.warn('⚠️ [GET /channels/config] Usando UUID fixo como último recurso');
      organizationId = '00000000-0000-0000-0000-000000000001';
    }

    console.log(`📡 [GET /channels/config] Organization: ${organizationId}`);

    // Buscar do Supabase Database
    // ⚠️ NÃO usar select('*') - a tabela pode não ter updated_at
    const { data, error } = await client
      .from('organization_channel_config')
      .select('organization_id, created_at, whatsapp_enabled, whatsapp_api_url, whatsapp_instance_name, whatsapp_api_key, whatsapp_instance_token, whatsapp_connected, whatsapp_phone_number, whatsapp_qr_code, whatsapp_connection_status, whatsapp_last_connected_at, whatsapp_error_message, sms_enabled, sms_account_sid, sms_auth_token, sms_phone_number, sms_credits_used, sms_last_recharged_at, automation_reservation_confirmation, automation_checkin_reminder, automation_checkout_review, automation_payment_reminder')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ [GET /channels/config] Database error:', error);
      return c.json(errorResponse('Erro ao buscar configurações', { details: error.message }), 500);
    }

    // ✅ SEMPRE retornar um objeto, mesmo que vazio
    if (!data) {
      console.log(`ℹ️ [GET /channels/config] No config found for org ${organizationId}, returning empty config`);
      return c.json(successResponse({
        organization_id: organizationId,
        whatsapp: {
          enabled: false,
          api_url: '',
          instance_name: '',
          api_key: '',
          instance_token: '',
          connected: false,
          connection_status: 'disconnected'
        },
        sms: {
          enabled: false,
          account_sid: '',
          auth_token: '',
          phone_number: '',
          credits_used: 0
        },
        automations: {
          reservation_confirmation: false,
          checkin_reminder: false,
          checkout_review: false,
          payment_reminder: false
        },
        created_at: new Date().toISOString()
      }));
    }

    // Converter formato do banco para API
    const config = {
      organization_id: data.organization_id,
      whatsapp: {
        enabled: data.whatsapp_enabled ?? false,
        api_url: data.whatsapp_api_url || '',
        instance_name: data.whatsapp_instance_name || '',
        api_key: data.whatsapp_api_key || '',
        instance_token: data.whatsapp_instance_token || '',
        connected: data.whatsapp_connected ?? false,
        phone_number: data.whatsapp_phone_number || null,
        qr_code: data.whatsapp_qr_code || null,
        connection_status: data.whatsapp_connection_status || 'disconnected',
        last_connected_at: data.whatsapp_last_connected_at || null,
        error_message: data.whatsapp_error_message || null
      },
      sms: {
        enabled: data.sms_enabled ?? false,
        account_sid: data.sms_account_sid || '',
        auth_token: data.sms_auth_token || '',
        phone_number: data.sms_phone_number || '',
        credits_used: data.sms_credits_used ?? 0,
        last_recharged_at: data.sms_last_recharged_at || null
      },
      automations: {
        reservation_confirmation: data.automation_reservation_confirmation ?? false,
        checkin_reminder: data.automation_checkin_reminder ?? false,
        checkout_review: data.automation_checkout_review ?? false,
        payment_reminder: data.automation_payment_reminder ?? false
      },
      created_at: data.created_at
    };

    console.log(`✅ [GET /channels/config] Config found for org ${organizationId}`);
    return c.json(successResponse(config));
  } catch (error) {
    console.error('❌ [GET /channels/config] Error:', error);
    return c.json(errorResponse(
      error instanceof Error ? error.message : 'Erro ao buscar configurações'
    ), 500);
  }
});

// POST /chat/channels/config - Salvar configurações de canal
chat.post("/channels/config", async (c) => {
  const client = getSupabaseClient();

  const orgId = await ensureOrganizationId(c);

  const body = await c.req.json();

  const dbData = {
    organization_id: orgId,
    whatsapp_enabled: body.whatsapp?.enabled ?? false,
    whatsapp_api_url: body.whatsapp?.api_url ?? "",
    whatsapp_instance_name: body.whatsapp?.instance_name ?? "",
    whatsapp_instance_token: body.whatsapp?.instance_token ?? "",
  };

  const { data, error } = await safeUpsert(
    client,
    "organization_channel_config",
    dbData,
    { onConflict: "organization_id" },
    "organization_id, whatsapp_enabled, whatsapp_api_url, whatsapp_instance_name, whatsapp_instance_token"
  );

  if (error) return c.json(errorResponse(error.message), 500);

  return c.json(successResponse(data));
});

// ============================================
// 🆕 EVOLUTION INSTANCES - Multi-Tenant (v1.0.103+)
// ============================================

// Get Evolution instance
// ✅ CORRIGIDO v1.0.103.400 - Alinhado com schema novo (sem user_id)
chat.get('/evolution/instance', async (c) => {
  try {
    const url = new URL(c.req.url);
    const instanceName = url.searchParams.get('instance_name'); // Opcional: buscar por nome

    console.log(`📡 [GET /evolution/instance]${instanceName ? ` Instance Name: ${instanceName}` : ' (primeira disponível)'}`);

    const client = kv.getSupabaseClient();
    
    // ✅ CORRIGIDO v1.0.103.400 - Schema novo não tem user_id, usar instance_name ou primeira
    let query = client
      .from('evolution_instances')
      .select('id, instance_name, instance_api_key, global_api_key, base_url, instance_token, created_at');
    
    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    }
    
    // Buscar primeira instância disponível (ordenada por created_at)
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    if (!data) {
      // Nenhuma instância encontrada
      console.log('ℹ️ No Evolution instance found in database');
      return c.json({
        success: true,
        data: null,
        message: 'No instance configured in database. Check environment variables.'
      });
    }

    console.log(`✅ Evolution instance found: ${data.instance_name}`);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error getting Evolution instance:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Create or update Evolution instance
// ✅ CORRIGIDO v1.0.103.400 - Alinhado com schema novo (sem user_id)
chat.post('/evolution/instance', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { instance_name, instance_api_key, global_api_key, base_url, instance_token } = body;

    // ✅ CORRIGIDO v1.0.103.400 - Removido user_id, instance_name agora é obrigatório e único
    if (!instance_name || !instance_api_key || !base_url) {
      return c.json(errorResponse(
        'Missing required fields: instance_name, instance_api_key, base_url'
      ), 400);
    }

    console.log(`📡 [POST /evolution/instance] Instance Name: ${instance_name}`);

    const client = kv.getSupabaseClient();

    // Normalizar URL
    const normalizedUrl = base_url.replace(/\/+$/, '');

    // ✅ CORRIGIDO v1.0.103.400 - Preparar dados sem user_id (conforme schema novo)
    const dbData = {
      instance_name: String(instance_name),
      instance_api_key: String(instance_api_key),
      global_api_key: global_api_key ? String(global_api_key) : null,
      base_url: normalizedUrl,
      instance_token: instance_token ? String(instance_token) : null,
    };

    // ✅ Usar safeUpsert para proteger contra triggers de updated_at
    // ✅ CORRIGIDO v1.0.103.400 - onConflict agora é por instance_name (único no schema)
    const selectFields = 'id, instance_name, instance_api_key, global_api_key, base_url, instance_token, created_at';
    
    // Verificar se já existe instância com mesmo nome
    const { data: existing } = await client
      .from('evolution_instances')
      .select('id')
      .eq('instance_name', instance_name)
      .maybeSingle();
    
    let result;
    if (existing) {
      // Atualizar existente
      const { data, error } = await client
        .from('evolution_instances')
        .update(dbData)
        .eq('id', existing.id)
        .select(selectFields)
        .single();
      
      result = { data, error };
    } else {
      // Inserir novo
      const { data, error } = await client
        .from('evolution_instances')
        .insert(dbData)
        .select(selectFields)
        .single();
      
      result = { data, error };
    }

    const { data, error } = result;

    if (error) {
      console.error('❌ [POST /evolution/instance] Database error:', error);
      return c.json(errorResponse('Erro ao salvar instância Evolution', { details: error.message }), 500);
    }

    if (!data) {
      return c.json(errorResponse('Instância Evolution não foi salva'), 500);
    }

    console.log(`✅ [POST /evolution/instance] Evolution instance saved: ${data.instance_name}`);
    return c.json(successResponse(data));
  } catch (error) {
    console.error('❌ [POST /evolution/instance] Error:', error);
    return c.json(errorResponse(
      error instanceof Error ? error.message : 'Erro ao salvar instância Evolution'
    ), 500);
  }
});

// Delete Evolution instance
// ✅ CORRIGIDO v1.0.103.400 - Alinhado com schema novo (sem user_id, usar ID UUID ou instance_name)
chat.delete('/evolution/instance/:id', async (c) => {
  try {
    const id = c.req.param('id'); // Pode ser UUID ou instance_name

    if (!id) {
      return c.json({ success: false, error: 'Missing instance id or name' }, 400);
    }

    console.log(`📡 [DELETE /evolution/instance/${id}]`);

    const client = kv.getSupabaseClient();
    
    // ✅ CORRIGIDO v1.0.103.400 - Tentar deletar por ID UUID primeiro, depois por instance_name
    // Verificar se é UUID válido
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let error;
    if (isUuid) {
      // Deletar por ID
      const result = await client
        .from('evolution_instances')
        .delete()
        .eq('id', id);
      error = result.error;
    } else {
      // Deletar por instance_name
      const result = await client
        .from('evolution_instances')
        .delete()
        .eq('instance_name', id);
      error = result.error;
    }

    if (error) {
      console.error('❌ Database error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Evolution instance deleted: ${id}`);
    return c.json({ success: true, message: 'Instance deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting Evolution instance:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// ============================================
// 🆕 SMS (Twilio) - v1.0.103+
// ============================================
// NOTE: Estas rotas serão implementadas depois do WhatsApp

// Configure Twilio
chat.post('/channels/sms/configure', async (c) => {
  return c.json({ 
    success: false, 
    error: 'SMS integration will be implemented in v1.0.103+',
    message: 'Feature coming soon!'
  }, 501);
});

// Send SMS
chat.post('/channels/sms/send', async (c) => {
  return c.json({ 
    success: false, 
    error: 'SMS send will be implemented in v1.0.103+',
    message: 'Feature coming soon!'
  }, 501);
});

// Get SMS credits
chat.post('/channels/sms/credits', async (c) => {
  return c.json({ 
    success: false, 
    error: 'SMS credits will be implemented in v1.0.103+',
    message: 'Feature coming soon!'
  }, 501);
});

// Webhook to receive SMS (from Twilio)
chat.post('/channels/sms/webhook', async (c) => {
  return c.json({ 
    success: false, 
    error: 'SMS webhook will be implemented in v1.0.103+',
    message: 'Feature coming soon!'
  }, 501);
});

export default chat;
