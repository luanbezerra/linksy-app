import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaStar, FaUserCircle, FaUsers, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import CreateSimpleConversationModal from '../../components/ConversationList/CreateSimpleConversationModal';
import CreateGroupModal from '../../components/ConversationList/CreateGroupModal';
import { ConversationProps } from '../../components/ConversationProfile/ConversationProfileModel';
import { MessageProps } from '../../components/SearchMessage/SearchMessageGlobalModel';
import { useNavigate } from "react-router-dom";
import axiosAuthInstance from '../../../API/axiosAuthInstance';

function ConversationList() {
  const { loggedId } = useParams<{ loggedId: string }>();
  const [conversations, setConversations] = useState<ConversationProps[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSimpleConversationModal, setShowCreateSimpleConversationModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [loggedId]);

  const fetchConversations = async () => {
    try {
      const response = await axiosAuthInstance.get(`/user/${loggedId}/conversation`);
      if (response.data) {
        setConversations(response.data);
        setAuthenticated(true)
      }
    } catch (error) {
      setError('Error fetching conversations');
      console.error(error);
      navigate(`/user/login`)
    }
  };

  const searchMessages = async (targetWord: string) => {
    try {
      const response = await axiosAuthInstance.get(`/user/${loggedId}/conversation/search`, {
        params: { targetWord },
      });
      console.log("Mensagens filtradas:", response.data);
      if (response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      setError('Error searching messages');
      console.error(error);
    }
  };

  const loopSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') {
      setMessages([]);
    } else {
      searchMessages(value);
    }
  };

  const toggleFavorite = async (conversationId: string) => {
    try {
      await axiosAuthInstance.patch(`/user/${loggedId}/conversation/${conversationId}/favoritar`);
      setConversations(prevConversations =>
        prevConversations.map(conversation =>
          conversation.id === Number(conversationId)
            ? { ...conversation, favorited: !conversation.favorited }
            : conversation
        )
      );
      fetchConversations();
    } catch (error) {
      setError('Error toggling favorite');
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    authenticated &&
    <div className="p-6 pt-8 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between pb-8">
          <h1 className="text-4xl font-bold">Linksy</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={loopSearch}
                className="py-2 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            <button
              className="text-center text-white py-2 px-5 rounded-2xl bg-green-600 hover:bg-green-500 hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              data-cy={"new-group-button"}
            >
              Novo Grupo
            </button>
            <button
              className="text-center text-white py-2 px-5 rounded-2xl bg-green-600 hover:bg-green-500 hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
              type="button"
              onClick={() => setShowCreateSimpleConversationModal(true)}
              data-cy={"new-conversation-button"}
            >
              Nova Conversa
            </button>
            <button
             className="text-center text-white py-2 px-5 rounded-2xl bg-green-600 hover:bg-green-500 hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
              type="button"
              onClick={() => navigate(`/user/${loggedId}/friend/all`)}
            >Amigos
            </button>
            <div className="flex items-center justify-center">
            <div className=" cursor-pointer w-12 h-full bg-red-600 hover:bg-red-500 rounded-2xl flex items-center justify-center hover:shadow-lg focus:outline-none ease-linear transition-all duration-150">
              <FaSignOutAlt className="text-white text-3xl" onClick={() => {localStorage.removeItem('token'); navigate(`/user/login`)}}/>
            </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        <div
          className="conversation-list-container overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className="conversation-item bg-gray-200 p-4 mb-4 rounded flex justify-between"
              >
                <div className="flex items-center">
                  <FaUserCircle className="text-gray-500 mr-4 text-4xl" />
                  <div>
                    <div className="text-xl font-bold mb-2 text-black-600">
                      {message.conversationName}
                    </div>
                    <p>{message.content}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-semibold">{message.senderName}</h2>
                  <p className="text-sm text-gray-500">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className="conversation-item bg-gray-200 p-4 mb-4 rounded cursor-pointer flex justify-between items-center relative"
                data-cy={"conversation-list-id-"+conversation.id}
              >
                <Link
                  to={`/user/${loggedId}/conversation/${conversation.id}`}
                  className="conversation-link flex-1 flex items-center"
                >
                  {conversation.isGroup ? (
                    <FaUsers className="text-gray-500 mr-4 text-4xl" />
                  ) : (
                    <FaUserCircle className="text-gray-500 mr-4 text-4xl" />
                  )}
                  <div>
                    <div className='flex items-center'>
                    <h2 className="text-xl font-semibold" data-cy={"conversation-list-name-" + conversation.name}>{conversation.name}</h2>
                      {!conversation.isGroup && (
                        <h3 className='ml-4 text-gray-500' data-cy={"conversation-list-username-"+conversation.username}> {"("+conversation.username+")"}
                        </h3>
                      )}
                    </div>
                    <p>{conversation.lastMessage}</p>
                  </div>
                </Link>
                <FaStar
                  className={`cursor-pointer absolute top-1/2 transform -translate-y-1/2 right-4 text-3xl ${conversation.favorited ? 'text-yellow-500' : 'text-gray-400'}`}
                  onClick={() => toggleFavorite(String(conversation.id))}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateSimpleConversationModal && (
        <CreateSimpleConversationModal
          loggedId={loggedId}
          setShowCreateSimpleConversationModal={setShowCreateSimpleConversationModal}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          loggedId={loggedId}
          setShowCreateGroupModal={setShowCreateGroupModal}
        />
      )}
    </div>
  );
}

export default ConversationList;