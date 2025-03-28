import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';

// ----- Types -----
type Question = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type Topic = {
  title: string;
  summary: string;
  questions: Question[];
};

type StudyData = {
  topics: Topic[];
};

type Screen = 'home' | 'topic' | 'quiz';

// ----- Main App Component -----
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  // Quiz state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  // New state for shuffled choices
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  useEffect(() => {
    // Replace 'localhost' with your Mac’s IP if testing on a real device
    fetch('http://192.168.0.7:3000/topics')
      .then((res) => res.json())
      .then((data: StudyData) => {
        if (data.topics) {
          setTopics(data.topics);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // New useEffect to shuffle choices when the quiz question changes
  useEffect(() => {
    if (screen === 'quiz' && selectedTopic) {
      const currentQuestion = selectedTopic.questions[currentIndex];
      const choices = [...currentQuestion.choices];
      // Shuffle using the Fisher-Yates algorithm
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      setShuffledChoices(choices);
    }
  }, [screen, selectedTopic, currentIndex]);

  // ----- Home Screen: List all topics -----
  function renderHomeScreen() {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>Available Topics</Text>
          {topics.map((t, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.topicButton}
              onPress={() => {
                setSelectedTopic(t);
                setScreen('topic');
              }}
            >
              <Text style={styles.topicButtonText}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- Topic Screen: Show summary + "Start Questions" button -----
  function renderTopicScreen() {
    if (!selectedTopic) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            <Text>No topic selected.</Text>
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={styles.link}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const handleStartQuiz = () => {
      // Reset quiz state
      setCurrentIndex(0);
      setSelectedChoice(null);
      setFeedback('');
      setScore(0);
      setScreen('quiz');
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.topicTitle}>{selectedTopic.title}</Text>
          <Text style={styles.topicSummary}>{selectedTopic.summary}</Text>
          <TouchableOpacity style={styles.startQuizButton} onPress={handleStartQuiz}>
            <Text style={styles.startQuizButtonText}>Start Questions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('home')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- Quiz Screen: Interactive Q&A -----
  function renderQuizScreen() {
    if (!selectedTopic) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            <Text>No topic selected for quiz.</Text>
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={styles.link}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const questions = selectedTopic.questions;
    const currentQuestion = questions[currentIndex];

    const handleOptionPress = (option: string) => {
      if (selectedChoice) return; // Prevent multiple selections
      setSelectedChoice(option);
      if (option === currentQuestion.answer) {
        setFeedback('Correct!');
        setScore(score + 1);
      } else {
        setFeedback(`Incorrect! ${currentQuestion.explanation}`);
      }
    };

    const handleNext = () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedChoice(null);
        setFeedback('');
      } else {
        Alert.alert(
          'Quiz Complete',
          `Your score: ${score + (feedback.startsWith('Correct') ? 1 : 0)}/${questions.length}`
        );
        setScreen('home');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.quizTitle}>{selectedTopic.title}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          {shuffledChoices.map((choice) => (
            <TouchableOpacity
              key={choice}
              style={[
                styles.optionButton,
                selectedChoice === choice && styles.selectedButton,
              ]}
              onPress={() => handleOptionPress(choice)}
              disabled={!!selectedChoice}
            >
              <Text style={styles.optionText}>{choice}</Text>
            </TouchableOpacity>
          ))}
          {selectedChoice && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedback}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.progressText}>
            {`Question ${currentIndex + 1} of ${questions.length}`}
          </Text>
          <TouchableOpacity onPress={() => setScreen('topic')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Topic Detail</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- Loading state -----
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" />
          <Text>Loading topics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Main render logic: choose screen -----
  switch (screen) {
    case 'home':
      return renderHomeScreen();
    case 'topic':
      return renderTopicScreen();
    case 'quiz':
      return renderQuizScreen();
    default:
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            <Text>Invalid screen.</Text>
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={styles.link}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
  }
}

// ----- Updated Styles -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EF', // Light, warm background
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginVertical: 16,
    textAlign: 'center',
    color: '#333',
  },
  topicButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topicButtonText: {
    fontSize: 18,
    color: '#333',
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  topicSummary: {
    fontSize: 16,
    lineHeight: 22,
    color: '#444',
    marginBottom: 30,
  },
  startQuizButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 16,
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  questionText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
  },
  optionButton: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedButton: {
    backgroundColor: '#FFECB3', // Light amber for selected option
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  feedbackContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#E0F7FA', // Light teal background
    padding: 12,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#004D40',
  },
  nextButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#FF6F00',
    fontSize: 14,
  },
  link: {
    color: '#FF6F00',
    marginTop: 10,
    fontSize: 16,
  },
});
