import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Snippet = {
  id: string;
  title: string;
  code: string;
  language: string;
};

const DEFAULT_SNIPPETS: Snippet[] = [
  { 
    id: '1', 
    title: 'Fetch Record by ID', 
    language: 'Deluge', 
    code: 'response = zoho.creator.getRecordById("app_link_name", "form_link_name", record_id, "connection_name");\ninfo response;' 
  },
  { 
    id: '2', 
    title: 'Update Record', 
    language: 'Deluge', 
    code: 'update_map = Map();\nupdate_map.put("Field_Name", "New Value");\nzoho.creator.updateRecord("app_name", "report_name", record_id, update_map, "connection_name");' 
  },
];

export default function CodeVaultScreen() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load data tightly when app opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('@creator_snippets');
        if (storedData !== null) {
          setSnippets(JSON.parse(storedData));
        } else {
          setSnippets(DEFAULT_SNIPPETS); // Load defaults only on first opening
        }
      } catch (e) {
        console.error("Error loading snippets", e);
      }
    };
    loadData();
  }, []);

  // Save data every time snippets array changes
  useEffect(() => {
    const saveData = async () => {
      try {
        if (snippets.length > 0 || snippets !== DEFAULT_SNIPPETS) {
            // we save everything including empty array if they deleted all
            await AsyncStorage.setItem('@creator_snippets', JSON.stringify(snippets));
        }
      } catch (e) {
        console.error("Error saving snippets", e);
      }
    };
    saveData();
  }, [snippets]);

  const addSnippet = () => {
    if (newTitle.trim() === '' || newCode.trim() === '') return;
    
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: newTitle,
      language: 'Deluge',
      code: newCode,
    };
    
    setSnippets([newSnippet, ...snippets]);
    setNewTitle('');
    setNewCode('');
    setIsAdding(false);
  };

  const copyToClipboard = async (id: string, code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter(s => s.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Ionicons name="server-outline" size={32} color="#00E676" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>Creator Vault</Text>
            <Text style={styles.subtitle}>Your Deluge Snippets</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButtonHeader}
          onPress={() => setIsAdding(!isAdding)}
        >
          <Ionicons name={isAdding ? "close" : "add"} size={28} color="#1E1E1E" />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addFormContainer}>
          <Text style={styles.formLabel}>Snippet Title</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="e.g. Fetch Record by ID"
            placeholderTextColor="#888"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <Text style={styles.formLabel}>Code</Text>
          <TextInput
            style={styles.inputCode}
            placeholder="// Write or paste your code here"
            placeholderTextColor="#888"
            value={newCode}
            onChangeText={setNewCode}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.saveButton} onPress={addSnippet}>
            <Text style={styles.saveButtonText}>Save to Vault</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {snippets.map(snippet => (
          <View key={snippet.id} style={styles.snippetCard}>
            <View style={styles.cardHeader}>
              <View style={{flexShrink: 1}}>
                <Text style={styles.snippetTitle} numberOfLines={1}>{snippet.title}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{snippet.language}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.iconBtn} 
                  onPress={() => copyToClipboard(snippet.id, snippet.code)}
                >
                  <Ionicons 
                    name={copiedId === snippet.id ? "checkmark-done" : "copy-outline"} 
                    size={22} 
                    color={copiedId === snippet.id ? "#00E676" : "#A0A0A0"} 
                  />
                  {copiedId === snippet.id && <Text style={styles.copiedText}>Copied</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => deleteSnippet(snippet.id)}>
                  <Ionicons name="trash-outline" size={22} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{snippet.code}</Text>
            </View>
          </View>
        ))}
        {snippets.length === 0 && !isAdding && (
            <View style={{alignItems: 'center', marginTop: 40}}>
                <Ionicons name="folder-open-outline" size={48} color="#2c2c2c" />
                <Text style={{color: '#888', marginTop: 12}}>No Snippets. Click + to add some!</Text>
            </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00E676', 
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  addButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addFormContainer: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  formLabel: {
    color: '#A0A0A0',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputTitle: {
    backgroundColor: '#2C2C2C',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  inputCode: {
    backgroundColor: '#000000', 
    color: '#00E676', 
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minHeight: 120,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#00E676',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
    padding: 20,
  },
  snippetCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  snippetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  tagBadge: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  iconBtn: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedText: {
    color: '#00E676',
    fontSize: 10,
    position: 'absolute',
    bottom: -16,
  },
  codeBlock: {
    backgroundColor: '#0A0A0A',
    padding: 16,
  },
  codeText: {
    color: '#B0BEC5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
});
