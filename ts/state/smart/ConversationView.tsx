// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ConversationPanel } from './ConversationPanel';
import { ConversationView } from '../../components/conversation/ConversationView';
import { SmartCompositionArea } from './CompositionArea';
import { SmartConversationHeader } from './ConversationHeader';
import { SmartTimeline } from './Timeline';
import {
  getActivePanel,
  getIsPanelAnimating,
  getSelectedConversationId,
  getSelectedMessageIds,
} from '../selectors/conversations';
import { useComposerActions } from '../ducks/composer';
import { useConversationsActions } from '../ducks/conversations';
import { isShowingAnyModal } from '../selectors/globalModals';

function renderCompositionArea(
  conversationId: string,
  encodedMessage: number[],
  setEncodedMessage: (arg0: number[]) => void,
  isSendingSecretMessage: boolean,
  setIsSendingSecretMessage: (arg0: boolean) => void
) {
  return (
    <SmartCompositionArea
      id={conversationId}
      encodedMessage={encodedMessage}
      setEncodedMessage={setEncodedMessage}
      isSendingSecretMessage={isSendingSecretMessage}
      setIsSendingSecretMessage={setIsSendingSecretMessage}
    />
  );
}

function renderConversationHeader(
  conversationId: string,
  showSecretView: boolean,
  setShowSecretView: (arg0: boolean) => void
) {
  return (
    <SmartConversationHeader
      id={conversationId}
      showSecretView={showSecretView}
      setShowSecretView={setShowSecretView}
    />
  );
}

function renderTimeline(conversationId: string) {
  return <SmartTimeline key={conversationId} id={conversationId} />;
}

function renderPanel(conversationId: string) {
  return <ConversationPanel conversationId={conversationId} />;
}

export const SmartConversationView = memo(
  function SmartConversationView(): JSX.Element {
    const conversationId = useSelector(getSelectedConversationId);

    if (!conversationId) {
      throw new Error('SmartConversationView: No selected conversation');
    }

    const { toggleSelectMode } = useConversationsActions();
    const selectedMessageIds = useSelector(getSelectedMessageIds);
    const isSelectMode = selectedMessageIds != null;

    const { processAttachments } = useComposerActions();

    const hasOpenModal = useSelector(isShowingAnyModal);
    const activePanel = useSelector(getActivePanel);
    const isPanelAnimating = useSelector(getIsPanelAnimating);
    const shouldHideConversationView = activePanel && !isPanelAnimating;

    const onExitSelectMode = useCallback(() => {
      toggleSelectMode(false);
    }, [toggleSelectMode]);

    return (
      <ConversationView
        conversationId={conversationId}
        hasOpenModal={hasOpenModal}
        hasOpenPanel={activePanel != null}
        isSelectMode={isSelectMode}
        onExitSelectMode={onExitSelectMode}
        processAttachments={processAttachments}
        renderCompositionArea={renderCompositionArea}
        renderConversationHeader={renderConversationHeader}
        renderTimeline={renderTimeline}
        renderPanel={renderPanel}
        shouldHideConversationView={shouldHideConversationView}
      />
    );
  }
);
