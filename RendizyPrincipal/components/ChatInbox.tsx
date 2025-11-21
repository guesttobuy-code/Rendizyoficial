/**
 * RENDIZY - Chat Inbox
 * Simplified container that composes filters, contacts and conversation
 * Ensures the left column (filters + contacts) scrolls independently.
 */

import React, { useState } from 'react';
import { ChatFilterSidebar } from './ChatFilterSidebar';
import { EvolutionContactsList } from './EvolutionContactsList';
import { WhatsAppConversation } from './WhatsAppConversation';
import { ScrollArea } from './ui/scroll-area';

export function ChatInbox() {
	const [selectedContact, setSelectedContact] = useState<any | null>(null);

	return (
		<div className="flex h-full min-h-[600px]">
			{/* Left column: filters + contacts */}
			<div className="flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" style={{ minWidth: 320 }}>
				{/* Filters (fixed height header area inside left column) */}
				<div className="h-auto">
					<ChatFilterSidebar
						properties={[]}
						selectedProperties={[]}
						onToggleProperty={() => {}}
						dateRange={{ from: new Date(), to: new Date() }}
						onDateRangeChange={() => {}}
						selectedStatuses={['unread','read','active','resolved']}
						onStatusesChange={() => {}}
						selectedChannels={[]}
						onChannelsChange={() => {}}
						selectedTags={[]}
						onTagsChange={() => {}}
						chatTags={[]}
						onManageTags={() => {}}
					/>
				</div>

				{/* Contacts list should take remaining height and scroll independently */}
				<div className="flex-1 min-h-0">
					<ScrollArea className="h-full">
						<EvolutionContactsList
							onContactSelect={(c) => setSelectedContact(c)}
							selectedContactId={selectedContact?.id}
						/>
					</ScrollArea>
				</div>
			</div>

			{/* Middle column: conversation */}
			<div className="flex-1 flex flex-col">
				{selectedContact ? (
					<WhatsAppConversation contact={selectedContact} />
				) : (
					<div className="flex-1 flex items-center justify-center text-gray-500">
						Selecione uma conversa à esquerda
					</div>
				)}
			</div>

			{/* Right column: optional details (kept empty for now) */}
			<div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden lg:flex flex-col">
				<div className="p-4 text-sm text-gray-600">Detalhes</div>
			</div>
		</div>
	);
}

export default ChatInbox;
 