/**
 * RENDIZY - Chat Inbox with Evolution API Integration
 * 
 * Wrapper que integra a lista de contatos da Evolution API com o ChatInbox existente
 * 
 * @version v1.0.103.164
 * @date 2025-10-31
 */

import React, { useState } from 'react';
import { ChatInbox } from './ChatInbox';
import { EvolutionContactsList } from './EvolutionContactsList';
import { LocalContact } from '../utils/services/evolutionContactsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageSquare, Smartphone, Users } from 'lucide-react';

export function ChatInboxWithEvolution() {
  const [selectedContact, setSelectedContact] = useState<LocalContact | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'whatsapp'>('inbox');

  const handleContactSelect = (contact: LocalContact) => {
    setSelectedContact(contact);
    console.log('📱 Contato selecionado:', contact);
    // TODO: Abrir conversa com este contato no futuro
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Tabs no topo */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b">
          <TabsList className="w-full grid grid-cols-2 max-w-md rounded-none bg-transparent border-b-0 h-14">
            <TabsTrigger 
              value="inbox" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              <MessageSquare className="w-4 h-4" />
              Chat Inbox
            </TabsTrigger>
            <TabsTrigger 
              value="whatsapp" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none"
            >
              <Smartphone className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content: Chat Inbox Completo */}
        <TabsContent value="inbox" className="flex-1 m-0">
          <ChatInbox />
        </TabsContent>

        {/* Tab Content: WhatsApp Evolution */}
        <TabsContent value="whatsapp" className="flex-1 m-0">
          <div className="flex h-full">
            {/* Sidebar com contatos */}
            <div className="w-80 border-r bg-white dark:bg-gray-800 flex flex-col">
              <EvolutionContactsList
                onContactSelect={handleContactSelect}
                selectedContactId={selectedContact?.id}
              />
            </div>

            {/* Área de conversa */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <div className="flex-1 flex flex-col">
                  {/* Header da conversa */}
                  <div className="border-b bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        {selectedContact.profilePicUrl ? (
                          <img
                            src={selectedContact.profilePicUrl}
                            alt={selectedContact.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {selectedContact.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedContact.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedContact.phone}
                        </p>
                      </div>
                      {selectedContact.isOnline && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Online
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <p className="text-lg">Nenhuma mensagem ainda</p>
                      <p className="text-sm mt-1">
                        Inicie uma conversa com {selectedContact.name}
                      </p>
                    </div>
                  </div>

                  {/* Input de mensagem */}
                  <div className="border-t bg-white dark:bg-gray-800 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite uma mensagem..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <MessageSquare className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl">Selecione um contato</p>
                    <p className="text-sm mt-2">
                      Escolha um contato do WhatsApp para iniciar uma conversa
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
