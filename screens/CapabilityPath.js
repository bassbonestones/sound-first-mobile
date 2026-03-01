/**
 * CapabilityPath.js - Curriculum Planning Tool
 * 
 * Allows organizing and planning the teaching order of capabilities.
 * Loads from capability_path.csv and persists changes to AsyncStorage.
 * Export function copies CSV back to clipboard for saving.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import ResetButton from '../components/ResetButton';

// Categories for grouping
const CATEGORIES = [
  'Fundamentals',
  'Clefs',
  'Time Signatures',
  'Key Signatures',
  'Note Values',
  'Rests',
  'Melodic Intervals Asc',
  'Melodic Intervals Desc',
  'Harmonic Intervals',
  'Dynamics',
  'Dynamic Changes',
  'Articulations',
  'Ornaments',
  'Tempo Terms',
  'Expression Terms',
  'Repeat Structures',
  'Tuplets',
  'Other Notation',
];

const TYPE_OPTIONS = [
  { label: 'P - Prerequisite', value: 'P' },
  { label: 'T - Teachable in Context', value: 'T' },
];

const STORAGE_KEY = '@capability_path_data';

// Initial data from CSV - all 177 capabilities
const INITIAL_DATA = [
  { id: 1, capability: 'notation_staff', display_name: 'The Staff (5 Lines)', category: 'Fundamentals', teaching_order: 1, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Must understand staff before any notation' },
  { id: 2, capability: 'clef_bass', display_name: 'Bass Clef (F Clef)', category: 'Clefs', teaching_order: 2, type: 'P', mastery_count: 1, teaching_materials: '', notes: "Trombone's primary clef" },
  { id: 3, capability: 'notation_time_signature_concept', display_name: 'Time Signature Basics', category: 'Fundamentals', teaching_order: 3, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'What time signatures mean in general' },
  { id: 4, capability: 'time_sig_4_4', display_name: '4/4 Time (Common Time)', category: 'Time Signatures', teaching_order: 4, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Most common meter - start here' },
  { id: 5, capability: 'notation_key_signature_concept', display_name: 'Key Signature Basics', category: 'Fundamentals', teaching_order: 5, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'What key signatures mean' },
  { id: 6, capability: 'key_c_major', display_name: 'C Major / A minor', category: 'Key Signatures', teaching_order: 6, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'No sharps/flats - easiest to read' },
  { id: 7, capability: 'notation_sharp', display_name: 'Sharp Symbol (♯)', category: 'Fundamentals', teaching_order: 7, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Raises pitch by half step' },
  { id: 8, capability: 'notation_flat', display_name: 'Flat Symbol (♭)', category: 'Fundamentals', teaching_order: 8, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Lowers pitch by half step' },
  { id: 9, capability: 'note_whole', display_name: 'Whole Note', category: 'Note Values', teaching_order: 9, type: 'P', mastery_count: 1, teaching_materials: 'long_tone_whole_F3.musicxml', notes: '4 beats - good for long tones' },
  { id: 10, capability: 'note_half', display_name: 'Half Note', category: 'Note Values', teaching_order: 10, type: 'P', mastery_count: 1, teaching_materials: 'long_tone_half_F3.musicxml', notes: '2 beats' },
  { id: 11, capability: 'note_quarter', display_name: 'Quarter Note', category: 'Note Values', teaching_order: 11, type: 'P', mastery_count: 1, teaching_materials: 'quarter_note_exercise.musicxml', notes: '1 beat - the pulse' },
  { id: 12, capability: 'rest_whole', display_name: 'Whole Rest', category: 'Rests', teaching_order: 12, type: 'P', mastery_count: 1, teaching_materials: '', notes: '4 beats of silence' },
  { id: 13, capability: 'rest_half', display_name: 'Half Rest', category: 'Rests', teaching_order: 13, type: 'P', mastery_count: 1, teaching_materials: '', notes: '2 beats of silence' },
  { id: 14, capability: 'rest_quarter', display_name: 'Quarter Rest', category: 'Rests', teaching_order: 14, type: 'P', mastery_count: 1, teaching_materials: '', notes: '1 beat of silence' },
  { id: 15, capability: 'interval_melodic_M2_ascending', display_name: 'Major 2nd Up', category: 'Melodic Intervals Asc', teaching_order: 15, type: 'P', mastery_count: 1, teaching_materials: 'do_re_do.musicxml', notes: 'First interval - stepwise motion' },
  { id: 16, capability: 'interval_melodic_M2_descending', display_name: 'Major 2nd Down', category: 'Melodic Intervals Desc', teaching_order: 16, type: 'P', mastery_count: 1, teaching_materials: 're_do_re.musicxml', notes: 'Descending step' },
  { id: 17, capability: 'key_f_major', display_name: 'F Major / D minor', category: 'Key Signatures', teaching_order: 17, type: 'P', mastery_count: 1, teaching_materials: '', notes: '1 flat - natural key for brass' },
  { id: 18, capability: 'interval_melodic_m2_ascending', display_name: 'Minor 2nd Up', category: 'Melodic Intervals Asc', teaching_order: 18, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Half step up' },
  { id: 19, capability: 'interval_melodic_m2_descending', display_name: 'Minor 2nd Down', category: 'Melodic Intervals Desc', teaching_order: 19, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Half step down' },
  { id: 20, capability: 'interval_melodic_M3_ascending', display_name: 'Major 3rd Up', category: 'Melodic Intervals Asc', teaching_order: 20, type: 'P', mastery_count: 1, teaching_materials: 'do_mi_do.musicxml', notes: 'Skip - Do to Mi' },
  { id: 21, capability: 'interval_melodic_M3_descending', display_name: 'Major 3rd Down', category: 'Melodic Intervals Desc', teaching_order: 21, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Mi to Do' },
  { id: 22, capability: 'interval_melodic_m3_ascending', display_name: 'Minor 3rd Up', category: 'Melodic Intervals Asc', teaching_order: 22, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Smaller skip' },
  { id: 23, capability: 'interval_melodic_m3_descending', display_name: 'Minor 3rd Down', category: 'Melodic Intervals Desc', teaching_order: 23, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 24, capability: 'note_eighth', display_name: 'Eighth Note', category: 'Note Values', teaching_order: 24, type: 'P', mastery_count: 2, teaching_materials: 'eighth_note_intro.musicxml', notes: 'Half a beat - subdivision begins' },
  { id: 25, capability: 'rest_eighth', display_name: 'Eighth Rest', category: 'Rests', teaching_order: 25, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Half beat rest' },
  { id: 26, capability: 'articulation_legato', display_name: 'Legato', category: 'Articulations', teaching_order: 26, type: 'P', mastery_count: 2, teaching_materials: 'slur_pairs.musicxml', notes: 'Smooth connected - slurs' },
  { id: 27, capability: 'articulation_staccato', display_name: 'Staccato', category: 'Articulations', teaching_order: 27, type: 'P', mastery_count: 2, teaching_materials: 'staccato_intro.musicxml', notes: 'Short detached' },
  { id: 28, capability: 'interval_melodic_P4_ascending', display_name: 'Perfect 4th Up', category: 'Melodic Intervals Asc', teaching_order: 28, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Do to Fa' },
  { id: 29, capability: 'interval_melodic_P4_descending', display_name: 'Perfect 4th Down', category: 'Melodic Intervals Desc', teaching_order: 29, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 30, capability: 'interval_melodic_P5_ascending', display_name: 'Perfect 5th Up', category: 'Melodic Intervals Asc', teaching_order: 30, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Do to Sol' },
  { id: 31, capability: 'interval_melodic_P5_descending', display_name: 'Perfect 5th Down', category: 'Melodic Intervals Desc', teaching_order: 31, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 32, capability: 'dynamic_p', display_name: 'Piano (p)', category: 'Dynamics', teaching_order: 32, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Soft - core dynamic' },
  { id: 33, capability: 'dynamic_f', display_name: 'Forte (f)', category: 'Dynamics', teaching_order: 33, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Loud - core dynamic' },
  { id: 34, capability: 'time_sig_3_4', display_name: '3/4 Time (Waltz Time)', category: 'Time Signatures', teaching_order: 34, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Waltz feel' },
  { id: 35, capability: 'time_sig_2_4', display_name: '2/4 Time', category: 'Time Signatures', teaching_order: 35, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'March feel' },
  { id: 36, capability: 'key_bb_major', display_name: 'Bb Major / G minor', category: 'Key Signatures', teaching_order: 36, type: 'P', mastery_count: 1, teaching_materials: '', notes: '2 flats - common brass key' },
  { id: 37, capability: 'key_g_major', display_name: 'G Major / E minor', category: 'Key Signatures', teaching_order: 37, type: 'P', mastery_count: 1, teaching_materials: '', notes: '1 sharp' },
  { id: 38, capability: 'note_dotted_half', display_name: 'Dotted Half Note', category: 'Note Values', teaching_order: 38, type: 'P', mastery_count: 1, teaching_materials: '', notes: '3 beats' },
  { id: 39, capability: 'note_dotted_quarter', display_name: 'Dotted Quarter Note', category: 'Note Values', teaching_order: 39, type: 'P', mastery_count: 1, teaching_materials: '', notes: '1.5 beats' },
  { id: 40, capability: 'notation_ties', display_name: 'Tied Notes', category: 'Note Values', teaching_order: 40, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Connected duration' },
  { id: 41, capability: 'articulation_accent', display_name: 'Accent (>)', category: 'Articulations', teaching_order: 41, type: 'P', mastery_count: 2, teaching_materials: 'accent_study.musicxml', notes: 'Emphasis' },
  { id: 42, capability: 'articulation_tenuto', display_name: 'Tenuto (-)', category: 'Articulations', teaching_order: 42, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Full value' },
  { id: 43, capability: 'interval_melodic_m6_ascending', display_name: 'Minor 6th Up', category: 'Melodic Intervals Asc', teaching_order: 43, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 44, capability: 'interval_melodic_m6_descending', display_name: 'Minor 6th Down', category: 'Melodic Intervals Desc', teaching_order: 44, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 45, capability: 'interval_melodic_M6_ascending', display_name: 'Major 6th Up', category: 'Melodic Intervals Asc', teaching_order: 45, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 46, capability: 'interval_melodic_M6_descending', display_name: 'Major 6th Down', category: 'Melodic Intervals Desc', teaching_order: 46, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 47, capability: 'note_sixteenth', display_name: 'Sixteenth Note', category: 'Note Values', teaching_order: 47, type: 'P', mastery_count: 3, teaching_materials: 'sixteenth_intro.musicxml', notes: 'Fast subdivision' },
  { id: 48, capability: 'rest_sixteenth', display_name: 'Sixteenth Rest', category: 'Rests', teaching_order: 48, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 49, capability: 'tuplet_triplet', display_name: 'Triplet', category: 'Tuplets', teaching_order: 49, type: 'P', mastery_count: 2, teaching_materials: 'triplet_intro.musicxml', notes: '3 in space of 2' },
  { id: 50, capability: 'time_sig_6_8', display_name: '6/8 Time', category: 'Time Signatures', teaching_order: 50, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Compound duple' },
  { id: 51, capability: 'dynamic_mp', display_name: 'Mezzo-piano (mp)', category: 'Dynamics', teaching_order: 51, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Medium soft' },
  { id: 52, capability: 'dynamic_mf', display_name: 'Mezzo-forte (mf)', category: 'Dynamics', teaching_order: 52, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Medium loud' },
  { id: 53, capability: 'dynamic_pp', display_name: 'Pianissimo (pp)', category: 'Dynamics', teaching_order: 53, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very soft' },
  { id: 54, capability: 'dynamic_ff', display_name: 'Fortissimo (ff)', category: 'Dynamics', teaching_order: 54, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very loud' },
  { id: 55, capability: 'dynamic_change_crescendo', display_name: 'Crescendo', category: 'Dynamic Changes', teaching_order: 55, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Getting louder' },
  { id: 56, capability: 'dynamic_change_diminuendo', display_name: 'Diminuendo / Decrescendo', category: 'Dynamic Changes', teaching_order: 56, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Getting softer' },
  { id: 57, capability: 'interval_melodic_P8_ascending', display_name: 'Octave Up', category: 'Melodic Intervals Asc', teaching_order: 57, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Full octave leap' },
  { id: 58, capability: 'interval_melodic_P8_descending', display_name: 'Octave Down', category: 'Melodic Intervals Desc', teaching_order: 58, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 59, capability: 'interval_melodic_m7_ascending', display_name: 'Minor 7th Up', category: 'Melodic Intervals Asc', teaching_order: 59, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 60, capability: 'interval_melodic_m7_descending', display_name: 'Minor 7th Down', category: 'Melodic Intervals Desc', teaching_order: 60, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 61, capability: 'interval_melodic_M7_ascending', display_name: 'Major 7th Up', category: 'Melodic Intervals Asc', teaching_order: 61, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 62, capability: 'interval_melodic_M7_descending', display_name: 'Major 7th Down', category: 'Melodic Intervals Desc', teaching_order: 62, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 63, capability: 'interval_melodic_A4_ascending', display_name: 'Tritone Up', category: 'Melodic Intervals Asc', teaching_order: 63, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Augmented 4th / Diminished 5th' },
  { id: 64, capability: 'interval_melodic_A4_descending', display_name: 'Tritone Down', category: 'Melodic Intervals Desc', teaching_order: 64, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 65, capability: 'key_d_major', display_name: 'D Major / B minor', category: 'Key Signatures', teaching_order: 65, type: 'P', mastery_count: 1, teaching_materials: '', notes: '2 sharps' },
  { id: 66, capability: 'key_eb_major', display_name: 'Eb Major / C minor', category: 'Key Signatures', teaching_order: 66, type: 'P', mastery_count: 1, teaching_materials: '', notes: '3 flats' },
  { id: 67, capability: 'key_a_major', display_name: 'A Major / F# minor', category: 'Key Signatures', teaching_order: 67, type: 'P', mastery_count: 1, teaching_materials: '', notes: '3 sharps' },
  { id: 68, capability: 'key_ab_major', display_name: 'Ab Major / F minor', category: 'Key Signatures', teaching_order: 68, type: 'P', mastery_count: 1, teaching_materials: '', notes: '4 flats' },
  { id: 69, capability: 'time_sig_2_2', display_name: '2/2 Time (Cut Time)', category: 'Time Signatures', teaching_order: 69, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Alla breve' },
  { id: 70, capability: 'articulation_marcato', display_name: 'Marcato (^)', category: 'Articulations', teaching_order: 70, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Strong accent' },
  { id: 71, capability: 'articulation_portato', display_name: 'Portato', category: 'Articulations', teaching_order: 71, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Legato staccato' },
  { id: 72, capability: 'articulation_staccatissimo', display_name: 'Staccatissimo', category: 'Articulations', teaching_order: 72, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Very short' },
  { id: 73, capability: 'ornament_grace_note', display_name: 'Grace Note', category: 'Ornaments', teaching_order: 73, type: 'P', mastery_count: 2, teaching_materials: 'grace_note_intro.musicxml', notes: 'Quick ornamental note' },
  { id: 74, capability: 'ornament_trill', display_name: 'Trill', category: 'Ornaments', teaching_order: 74, type: 'P', mastery_count: 2, teaching_materials: 'trill_intro.musicxml', notes: 'Rapid alternation' },
  { id: 75, capability: 'ornament_mordent', display_name: 'Mordent', category: 'Ornaments', teaching_order: 75, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 76, capability: 'ornament_inverted_mordent', display_name: 'Inverted Mordent (Prall)', category: 'Ornaments', teaching_order: 76, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 77, capability: 'ornament_turn', display_name: 'Turn', category: 'Ornaments', teaching_order: 77, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 78, capability: 'ornament_inverted_turn', display_name: 'Inverted Turn', category: 'Ornaments', teaching_order: 78, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 79, capability: 'repeat_sign', display_name: 'Repeat Sign', category: 'Repeat Structures', teaching_order: 79, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Go back and play again' },
  { id: 80, capability: 'repeat_first_ending', display_name: 'First Ending', category: 'Repeat Structures', teaching_order: 80, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 81, capability: 'repeat_second_ending', display_name: 'Second Ending', category: 'Repeat Structures', teaching_order: 81, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 82, capability: 'repeat_dc', display_name: 'D.C. (Da Capo)', category: 'Repeat Structures', teaching_order: 82, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'From the beginning' },
  { id: 83, capability: 'repeat_ds', display_name: 'D.S. (Dal Segno)', category: 'Repeat Structures', teaching_order: 83, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'From the sign' },
  { id: 84, capability: 'repeat_coda', display_name: 'Coda', category: 'Repeat Structures', teaching_order: 84, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 85, capability: 'repeat_segno', display_name: 'Segno', category: 'Repeat Structures', teaching_order: 85, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 86, capability: 'repeat_fine', display_name: 'Fine', category: 'Repeat Structures', teaching_order: 86, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'The end' },
  { id: 87, capability: 'note_dotted_whole', display_name: 'Dotted Whole Note', category: 'Note Values', teaching_order: 87, type: 'P', mastery_count: 1, teaching_materials: '', notes: '6 beats' },
  { id: 88, capability: 'note_dotted_eighth', display_name: 'Dotted Eighth Note', category: 'Note Values', teaching_order: 88, type: 'P', mastery_count: 1, teaching_materials: '', notes: '0.75 beats' },
  { id: 89, capability: 'note_dotted_sixteenth', display_name: 'Dotted Sixteenth Note', category: 'Note Values', teaching_order: 89, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 90, capability: 'note_double_dotted_half', display_name: 'Double-Dotted Half Note', category: 'Note Values', teaching_order: 90, type: 'P', mastery_count: 1, teaching_materials: '', notes: '3.5 beats' },
  { id: 91, capability: 'note_thirty_second', display_name: 'Thirty-Second Note', category: 'Note Values', teaching_order: 91, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Very fast' },
  { id: 92, capability: 'note_sixty_fourth', display_name: 'Sixty-Fourth Note', category: 'Note Values', teaching_order: 92, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Extremely fast' },
  { id: 93, capability: 'rest_thirty_second', display_name: 'Thirty-Second Rest', category: 'Rests', teaching_order: 93, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 94, capability: 'rest_multi_measure', display_name: 'Multi-Measure Rest', category: 'Rests', teaching_order: 94, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 95, capability: 'tuplet_duplet', display_name: 'Duplet', category: 'Tuplets', teaching_order: 95, type: 'P', mastery_count: 1, teaching_materials: '', notes: '2 in space of 3 (compound)' },
  { id: 96, capability: 'tuplet_quintuplet', display_name: 'Quintuplet', category: 'Tuplets', teaching_order: 96, type: 'P', mastery_count: 1, teaching_materials: '', notes: '5 in space of 4' },
  { id: 97, capability: 'tuplet_sextuplet', display_name: 'Sextuplet', category: 'Tuplets', teaching_order: 97, type: 'P', mastery_count: 1, teaching_materials: '', notes: '6 in space of 4' },
  { id: 98, capability: 'tuplet_septuplet', display_name: 'Septuplet', category: 'Tuplets', teaching_order: 98, type: 'P', mastery_count: 1, teaching_materials: '', notes: '7 in space of 4' },
  { id: 99, capability: 'time_sig_9_8', display_name: '9/8 Time', category: 'Time Signatures', teaching_order: 99, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Compound triple' },
  { id: 100, capability: 'time_sig_12_8', display_name: '12/8 Time', category: 'Time Signatures', teaching_order: 100, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Compound quadruple' },
  { id: 101, capability: 'time_sig_3_8', display_name: '3/8 Time', category: 'Time Signatures', teaching_order: 101, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 102, capability: 'time_sig_5_4', display_name: '5/4 Time', category: 'Time Signatures', teaching_order: 102, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Irregular' },
  { id: 103, capability: 'time_sig_7_8', display_name: '7/8 Time', category: 'Time Signatures', teaching_order: 103, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Irregular' },
  { id: 104, capability: 'time_sig_5_8', display_name: '5/8 Time', category: 'Time Signatures', teaching_order: 104, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Irregular' },
  { id: 105, capability: 'key_e_major', display_name: 'E Major / C# minor', category: 'Key Signatures', teaching_order: 105, type: 'P', mastery_count: 1, teaching_materials: '', notes: '4 sharps' },
  { id: 106, capability: 'key_db_major', display_name: 'Db Major / Bb minor', category: 'Key Signatures', teaching_order: 106, type: 'P', mastery_count: 1, teaching_materials: '', notes: '5 flats' },
  { id: 107, capability: 'key_b_major', display_name: 'B Major / G# minor', category: 'Key Signatures', teaching_order: 107, type: 'P', mastery_count: 1, teaching_materials: '', notes: '5 sharps' },
  { id: 108, capability: 'key_gb_major', display_name: 'Gb Major / Eb minor', category: 'Key Signatures', teaching_order: 108, type: 'P', mastery_count: 1, teaching_materials: '', notes: '6 flats' },
  { id: 109, capability: 'key_f_sharp_major', display_name: 'F# Major / D# minor', category: 'Key Signatures', teaching_order: 109, type: 'P', mastery_count: 1, teaching_materials: '', notes: '6 sharps' },
  { id: 110, capability: 'key_c_sharp_major', display_name: 'C# Major / A# minor', category: 'Key Signatures', teaching_order: 110, type: 'P', mastery_count: 1, teaching_materials: '', notes: '7 sharps' },
  { id: 111, capability: 'key_cb_major', display_name: 'Cb Major / Ab minor', category: 'Key Signatures', teaching_order: 111, type: 'P', mastery_count: 1, teaching_materials: '', notes: '7 flats' },
  { id: 112, capability: 'clef_treble', display_name: 'Treble Clef (G Clef)', category: 'Clefs', teaching_order: 112, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'For high brass / other instruments' },
  { id: 113, capability: 'clef_alto', display_name: 'Alto Clef (C Clef)', category: 'Clefs', teaching_order: 113, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Viola / advanced trombone' },
  { id: 114, capability: 'clef_tenor', display_name: 'Tenor Clef (C Clef)', category: 'Clefs', teaching_order: 114, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Trombone upper register' },
  { id: 115, capability: 'clef_treble_8vb', display_name: 'Treble Clef 8vb', category: 'Clefs', teaching_order: 115, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 116, capability: 'clef_bass_8va', display_name: 'Bass Clef 8va', category: 'Clefs', teaching_order: 116, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 117, capability: 'dynamic_ppp', display_name: 'Pianississimo (ppp)', category: 'Dynamics', teaching_order: 117, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very very soft' },
  { id: 118, capability: 'dynamic_fff', display_name: 'Fortississimo (fff)', category: 'Dynamics', teaching_order: 118, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very very loud' },
  { id: 119, capability: 'dynamic_sf', display_name: 'Sforzando (sf)', category: 'Dynamics', teaching_order: 119, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Sudden accent' },
  { id: 120, capability: 'dynamic_sfz', display_name: 'Sforzato (sfz)', category: 'Dynamics', teaching_order: 120, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Strong sudden accent' },
  { id: 121, capability: 'dynamic_sfp', display_name: 'Sforzando-piano (sfp)', category: 'Dynamics', teaching_order: 121, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Accent then soft' },
  { id: 122, capability: 'dynamic_fp', display_name: 'Forte-piano (fp)', category: 'Dynamics', teaching_order: 122, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Loud then immediately soft' },
  { id: 123, capability: 'dynamic_rf', display_name: 'Rinforzando (rf)', category: 'Dynamics', teaching_order: 123, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Reinforced' },
  { id: 124, capability: 'dynamic_rfz', display_name: 'Rinforzato (rfz)', category: 'Dynamics', teaching_order: 124, type: 'T', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 125, capability: 'dynamic_change_subito', display_name: 'Subito (sudden)', category: 'Dynamic Changes', teaching_order: 125, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Sudden change' },
  { id: 126, capability: 'tempo_largo', display_name: 'Largo', category: 'Tempo Terms', teaching_order: 126, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very slow' },
  { id: 127, capability: 'tempo_lento', display_name: 'Lento', category: 'Tempo Terms', teaching_order: 127, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Slow' },
  { id: 128, capability: 'tempo_adagio', display_name: 'Adagio', category: 'Tempo Terms', teaching_order: 128, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Slow and expressive' },
  { id: 129, capability: 'tempo_andante', display_name: 'Andante', category: 'Tempo Terms', teaching_order: 129, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Walking pace' },
  { id: 130, capability: 'tempo_andantino', display_name: 'Andantino', category: 'Tempo Terms', teaching_order: 130, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Slightly faster than andante' },
  { id: 131, capability: 'tempo_moderato', display_name: 'Moderato', category: 'Tempo Terms', teaching_order: 131, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Moderate speed' },
  { id: 132, capability: 'tempo_allegretto', display_name: 'Allegretto', category: 'Tempo Terms', teaching_order: 132, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Moderately fast' },
  { id: 133, capability: 'tempo_allegro', display_name: 'Allegro', category: 'Tempo Terms', teaching_order: 133, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Fast and lively' },
  { id: 134, capability: 'tempo_vivace', display_name: 'Vivace', category: 'Tempo Terms', teaching_order: 134, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Lively and fast' },
  { id: 135, capability: 'tempo_presto', display_name: 'Presto', category: 'Tempo Terms', teaching_order: 135, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Very fast' },
  { id: 136, capability: 'tempo_prestissimo', display_name: 'Prestissimo', category: 'Tempo Terms', teaching_order: 136, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'As fast as possible' },
  { id: 137, capability: 'tempo_accelerando', display_name: 'Accelerando', category: 'Tempo Terms', teaching_order: 137, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Gradually faster' },
  { id: 138, capability: 'tempo_ritardando', display_name: 'Ritardando (rit.)', category: 'Tempo Terms', teaching_order: 138, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Gradually slower' },
  { id: 139, capability: 'tempo_rallentando', display_name: 'Rallentando (rall.)', category: 'Tempo Terms', teaching_order: 139, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Gradually slower' },
  { id: 140, capability: 'tempo_a_tempo', display_name: 'A tempo', category: 'Tempo Terms', teaching_order: 140, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Return to original tempo' },
  { id: 141, capability: 'tempo_rubato', display_name: 'Rubato', category: 'Tempo Terms', teaching_order: 141, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Flexible tempo' },
  { id: 142, capability: 'expression_dolce', display_name: 'Dolce', category: 'Expression Terms', teaching_order: 142, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Sweetly' },
  { id: 143, capability: 'expression_cantabile', display_name: 'Cantabile', category: 'Expression Terms', teaching_order: 143, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'In a singing style' },
  { id: 144, capability: 'expression_espressivo', display_name: 'Espressivo', category: 'Expression Terms', teaching_order: 144, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Expressively' },
  { id: 145, capability: 'expression_con_brio', display_name: 'Con brio', category: 'Expression Terms', teaching_order: 145, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'With vigor' },
  { id: 146, capability: 'expression_con_fuoco', display_name: 'Con fuoco', category: 'Expression Terms', teaching_order: 146, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'With fire' },
  { id: 147, capability: 'expression_con_moto', display_name: 'Con moto', category: 'Expression Terms', teaching_order: 147, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'With motion' },
  { id: 148, capability: 'expression_grazioso', display_name: 'Grazioso', category: 'Expression Terms', teaching_order: 148, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Gracefully' },
  { id: 149, capability: 'expression_leggiero', display_name: 'Leggiero', category: 'Expression Terms', teaching_order: 149, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Lightly' },
  { id: 150, capability: 'expression_maestoso', display_name: 'Maestoso', category: 'Expression Terms', teaching_order: 150, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Majestically' },
  { id: 151, capability: 'expression_pesante', display_name: 'Pesante', category: 'Expression Terms', teaching_order: 151, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Heavily' },
  { id: 152, capability: 'expression_sostenuto', display_name: 'Sostenuto', category: 'Expression Terms', teaching_order: 152, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Sustained' },
  { id: 153, capability: 'expression_tranquillo', display_name: 'Tranquillo', category: 'Expression Terms', teaching_order: 153, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Tranquilly' },
  { id: 154, capability: 'expression_agitato', display_name: 'Agitato', category: 'Expression Terms', teaching_order: 154, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Agitated' },
  { id: 155, capability: 'expression_animato', display_name: 'Animato', category: 'Expression Terms', teaching_order: 155, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Animated' },
  { id: 156, capability: 'expression_appassionato', display_name: 'Appassionato', category: 'Expression Terms', teaching_order: 156, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Passionately' },
  { id: 157, capability: 'expression_brillante', display_name: 'Brillante', category: 'Expression Terms', teaching_order: 157, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Brilliantly' },
  { id: 158, capability: 'expression_morendo', display_name: 'Morendo', category: 'Expression Terms', teaching_order: 158, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Dying away' },
  { id: 159, capability: 'expression_perdendosi', display_name: 'Perdendosi', category: 'Expression Terms', teaching_order: 159, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Dying away completely' },
  { id: 160, capability: 'notation_fermata', display_name: 'Fermata', category: 'Other Notation', teaching_order: 160, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Hold longer' },
  { id: 161, capability: 'notation_breath_mark', display_name: 'Breath Mark', category: 'Other Notation', teaching_order: 161, type: 'T', mastery_count: 1, teaching_materials: '', notes: 'Take a breath' },
  { id: 162, capability: 'notation_chord_symbols', display_name: 'Chord Symbols', category: 'Other Notation', teaching_order: 162, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Jazz reading' },
  { id: 163, capability: 'notation_figured_bass', display_name: 'Figured Bass', category: 'Other Notation', teaching_order: 163, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Baroque' },
  { id: 164, capability: 'notation_2_voices', display_name: 'Two Voices', category: 'Other Notation', teaching_order: 164, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 165, capability: 'notation_3_voices', display_name: 'Three Voices', category: 'Other Notation', teaching_order: 165, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 166, capability: 'notation_4_voices', display_name: 'Four Voices', category: 'Other Notation', teaching_order: 166, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 167, capability: 'ornament_tremolo', display_name: 'Tremolo', category: 'Ornaments', teaching_order: 167, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 168, capability: 'ornament_glissando', display_name: 'Glissando', category: 'Ornaments', teaching_order: 168, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 169, capability: 'interval_harmonic_m2', display_name: 'Harmonic Minor 2nd', category: 'Harmonic Intervals', teaching_order: 200, type: 'P', mastery_count: 1, teaching_materials: '', notes: 'Piano/guitar - not brass' },
  { id: 170, capability: 'interval_harmonic_M2', display_name: 'Harmonic Major 2nd', category: 'Harmonic Intervals', teaching_order: 201, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 171, capability: 'interval_harmonic_m3', display_name: 'Harmonic Minor 3rd', category: 'Harmonic Intervals', teaching_order: 202, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 172, capability: 'interval_harmonic_M3', display_name: 'Harmonic Major 3rd', category: 'Harmonic Intervals', teaching_order: 203, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 173, capability: 'interval_harmonic_P4', display_name: 'Harmonic Perfect 4th', category: 'Harmonic Intervals', teaching_order: 204, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 174, capability: 'interval_harmonic_P5', display_name: 'Harmonic Perfect 5th', category: 'Harmonic Intervals', teaching_order: 205, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 175, capability: 'interval_harmonic_m6', display_name: 'Harmonic Minor 6th', category: 'Harmonic Intervals', teaching_order: 206, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 176, capability: 'interval_harmonic_M6', display_name: 'Harmonic Major 6th', category: 'Harmonic Intervals', teaching_order: 207, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
  { id: 177, capability: 'interval_harmonic_P8', display_name: 'Harmonic Octave', category: 'Harmonic Intervals', teaching_order: 208, type: 'P', mastery_count: 1, teaching_materials: '', notes: '' },
];

// Parse CSV string to array of objects
const parseCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line, index) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const obj = {};
    headers.forEach((header, i) => {
      let value = values[i] || '';
      // Convert numeric fields
      if (header === 'id' || header === 'teaching_order' || header === 'mastery_count') {
        obj[header] = parseInt(value, 10) || 0;
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
};

// Convert array of objects to CSV string
const toCSV = (data) => {
  const headers = ['id', 'capability', 'display_name', 'category', 'teaching_order', 'type', 'mastery_count', 'teaching_materials', 'notes'];
  const lines = [headers.join(',')];
  
  data.forEach(item => {
    const values = headers.map(h => {
      let val = item[h] ?? '';
      // Escape commas and quotes in string values
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
};

export default function CapabilityPath({ navigation }) {
  const [capabilities, setCapabilities] = useState([]);
  const [sortBy, setSortBy] = useState('teaching_order'); // 'teaching_order' or 'category'
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    capability: '',
    display_name: '',
    category: 'Fundamentals',
    teaching_order: 999,
    type: 'P',
    mastery_count: 1,
    teaching_materials: '',
    notes: '',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If INITIAL_DATA has more items, use it (new capabilities added)
        if (INITIAL_DATA.length > parsed.length) {
          console.log(`[CapabilityPath] Upgrading from ${parsed.length} to ${INITIAL_DATA.length} capabilities`);
          setCapabilities(INITIAL_DATA);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        } else {
          setCapabilities(parsed);
        }
      } else {
        // First time - use initial data
        setCapabilities(INITIAL_DATA);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      }
    } catch (e) {
      console.error('Failed to load capability data:', e);
      setCapabilities(INITIAL_DATA);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setHasUnsavedChanges(false);
      Alert.alert('Saved', 'Changes saved locally');
    } catch (e) {
      console.error('Failed to save:', e);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults?',
      `This will restore all ${INITIAL_DATA.length} capabilities to their default values. Any changes will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
            setCapabilities(INITIAL_DATA);
            setHasUnsavedChanges(false);
            Alert.alert('Reset Complete', `Loaded ${INITIAL_DATA.length} capabilities`);
          }
        },
      ]
    );
  };

  const exportToClipboard = async () => {
    const csv = toCSV(capabilities);
    await Clipboard.setStringAsync(csv);
    Alert.alert(
      'Exported!', 
      'CSV copied to clipboard.\n\nPaste into assets/capability_path.csv to persist changes.',
      [{ text: 'OK' }]
    );
  };

  const getSortedData = useCallback(() => {
    let data = [...capabilities];
    
    // Filter by category if not 'All'
    if (filterCategory !== 'All') {
      data = data.filter(c => c.category === filterCategory);
    }
    
    // Sort
    if (sortBy === 'teaching_order') {
      data.sort((a, b) => a.teaching_order - b.teaching_order);
    } else if (sortBy === 'category') {
      data.sort((a, b) => {
        const catA = CATEGORIES.indexOf(a.category);
        const catB = CATEGORIES.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.teaching_order - b.teaching_order;
      });
    }
    
    return data;
  }, [capabilities, sortBy, filterCategory]);

  const updateItem = (id, field, value) => {
    const updated = capabilities.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    setCapabilities(updated);
    setHasUnsavedChanges(true);
  };

  const moveItem = (id, direction) => {
    const sorted = getSortedData();
    const currentIndex = sorted.findIndex(c => c.id === id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    
    // Swap teaching_order values
    const currentOrder = sorted[currentIndex].teaching_order;
    const swapOrder = sorted[swapIndex].teaching_order;
    
    const updated = capabilities.map(c => {
      if (c.id === sorted[currentIndex].id) return { ...c, teaching_order: swapOrder };
      if (c.id === sorted[swapIndex].id) return { ...c, teaching_order: currentOrder };
      return c;
    });
    
    setCapabilities(updated);
    setHasUnsavedChanges(true);
  };

  const addNewItem = () => {
    const maxId = Math.max(...capabilities.map(c => c.id), 0);
    const item = {
      ...newItem,
      id: maxId + 1,
    };
    setCapabilities([...capabilities, item]);
    setShowAddModal(false);
    setNewItem({
      capability: '',
      display_name: '',
      category: 'Fundamentals',
      teaching_order: 999,
      type: 'P',
      mastery_count: 1,
      teaching_materials: '',
      notes: '',
    });
    setHasUnsavedChanges(true);
  };

  const deleteItem = (id) => {
    Alert.alert(
      'Delete Capability?',
      'Are you sure you want to remove this capability?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCapabilities(capabilities.filter(c => c.id !== id));
            setHasUnsavedChanges(true);
          }
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const isEditing = editingItem === item.id;
    
    return (
      <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
        {/* Order number and move buttons */}
        <View style={styles.orderCol}>
          <Text style={styles.orderNum}>{item.teaching_order}</Text>
          <View style={styles.moveButtons}>
            <TouchableOpacity 
              onPress={() => moveItem(item.id, 'up')}
              style={styles.moveBtn}
            >
              <Text style={styles.moveBtnText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => moveItem(item.id, 'down')}
              style={styles.moveBtn}
            >
              <Text style={styles.moveBtnText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main content */}
        <View style={styles.mainCol}>
          <Text style={styles.displayName}>{item.display_name}</Text>
          <Text style={styles.capability}>{item.capability}</Text>
          <Text style={styles.categoryBadge}>{item.category}</Text>
        </View>
        
        {/* Type and mastery */}
        <View style={styles.typeCol}>
          <TouchableOpacity 
            style={[styles.typeButton, item.type === 'P' ? styles.typeP : styles.typeT]}
            onPress={() => updateItem(item.id, 'type', item.type === 'P' ? 'T' : 'P')}
          >
            <Text style={styles.typeText}>{item.type}</Text>
          </TouchableOpacity>
          <View style={styles.masteryRow}>
            <Text style={styles.masteryLabel}>Need:</Text>
            <TouchableOpacity 
              style={styles.masteryBtn}
              onPress={() => updateItem(item.id, 'mastery_count', Math.max(1, item.mastery_count - 1))}
            >
              <Text>−</Text>
            </TouchableOpacity>
            <Text style={styles.masteryCount}>{item.mastery_count}</Text>
            <TouchableOpacity 
              style={styles.masteryBtn}
              onPress={() => updateItem(item.id, 'mastery_count', item.mastery_count + 1)}
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Edit/expand button */}
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => setEditingItem(isEditing ? null : item.id)}
        >
          <Text style={styles.editBtnText}>{isEditing ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {/* Expanded edit section */}
        {isEditing && (
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>Teaching Materials:</Text>
            <TextInput
              style={styles.editInput}
              value={item.teaching_materials}
              onChangeText={(text) => updateItem(item.id, 'teaching_materials', text)}
              placeholder="material1.musicxml, material2.musicxml"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.editLabel}>Notes:</Text>
            <TextInput
              style={[styles.editInput, styles.notesInput]}
              value={item.notes}
              onChangeText={(text) => updateItem(item.id, 'notes', text)}
              placeholder="Notes about teaching this capability..."
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => deleteItem(item.id)}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                'Unsaved Changes',
                'Save before leaving?',
                [
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                  { text: 'Save & Exit', onPress: async () => {
                    await saveData(capabilities);
                    navigation.goBack();
                  }},
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Capability Path</Text>
        <Text style={styles.subtitle}>{capabilities.length} capabilities</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'teaching_order' && styles.sortBtnActive]}
            onPress={() => setSortBy('teaching_order')}
          >
            <Text style={[styles.sortBtnText, sortBy === 'teaching_order' && styles.sortBtnTextActive]}>
              By Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'category' && styles.sortBtnActive]}
            onPress={() => setSortBy('category')}
          >
            <Text style={[styles.sortBtnText, sortBy === 'category' && styles.sortBtnTextActive]}>
              By Category
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterBtn, filterCategory === 'All' && styles.filterBtnActive]}
            onPress={() => setFilterCategory('All')}
          >
            <Text style={[styles.filterBtnText, filterCategory === 'All' && styles.filterBtnTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              style={[styles.filterBtn, filterCategory === cat && styles.filterBtnActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.filterBtnText, filterCategory === cat && styles.filterBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={getSortedData()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveBtn, !hasUnsavedChanges && styles.saveBtnDisabled]} 
          onPress={() => saveData(capabilities)}
          disabled={!hasUnsavedChanges}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.exportBtn} onPress={exportToClipboard}>
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetBtn} onPress={resetToDefaults}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Capability</Text>
            
            <Text style={styles.modalLabel}>Capability Code:</Text>
            <TextInput
              style={styles.modalInput}
              value={newItem.capability}
              onChangeText={(text) => setNewItem({ ...newItem, capability: text })}
              placeholder="e.g., note_whole"
              autoCapitalize="none"
            />
            
            <Text style={styles.modalLabel}>Display Name:</Text>
            <TextInput
              style={styles.modalInput}
              value={newItem.display_name}
              onChangeText={(text) => setNewItem({ ...newItem, display_name: text })}
              placeholder="e.g., Whole Note"
            />
            
            <Text style={styles.modalLabel}>Category:</Text>
            <ScrollView horizontal style={styles.categoryPicker}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.catOption, newItem.category === cat && styles.catOptionActive]}
                  onPress={() => setNewItem({ ...newItem, category: cat })}
                >
                  <Text style={[styles.catOptionText, newItem.category === cat && styles.catOptionTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.modalLabel}>Teaching Order:</Text>
            <TextInput
              style={styles.modalInput}
              value={newItem.teaching_order.toString()}
              onChangeText={(text) => setNewItem({ ...newItem, teaching_order: parseInt(text, 10) || 0 })}
              keyboardType="numeric"
            />
            
            <Text style={styles.modalLabel}>Type:</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeSelectorBtn, newItem.type === 'P' && styles.typeSelectorBtnActive]}
                onPress={() => setNewItem({ ...newItem, type: 'P' })}
              >
                <Text style={newItem.type === 'P' ? styles.typeSelectorTextActive : styles.typeSelectorText}>
                  P - Prerequisite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeSelectorBtn, newItem.type === 'T' && styles.typeSelectorBtnActive]}
                onPress={() => setNewItem({ ...newItem, type: 'T' })}
              >
                <Text style={newItem.type === 'T' ? styles.typeSelectorTextActive : styles.typeSelectorText}>
                  T - Teachable
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalAddBtn}
                onPress={addNewItem}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ResetButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#16213e',
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: '#4facfe',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    backgroundColor: '#16213e',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sortBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#2a2a4a',
  },
  sortBtnActive: {
    backgroundColor: '#4facfe',
  },
  sortBtnText: {
    color: '#888',
    fontSize: 14,
  },
  sortBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#2a2a4a',
  },
  filterBtnActive: {
    backgroundColor: '#00f2fe',
  },
  filterBtnText: {
    color: '#888',
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    backgroundColor: '#1e1e3f',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  rowAlt: {
    backgroundColor: '#252550',
  },
  orderCol: {
    width: 50,
    alignItems: 'center',
  },
  orderNum: {
    color: '#4facfe',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moveButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  moveBtn: {
    padding: 4,
  },
  moveBtnText: {
    color: '#666',
    fontSize: 12,
  },
  mainCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  displayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  capability: {
    color: '#888',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  categoryBadge: {
    color: '#00f2fe',
    fontSize: 11,
    marginTop: 4,
    backgroundColor: 'rgba(0,242,254,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeCol: {
    width: 70,
    alignItems: 'center',
  },
  typeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  typeP: {
    backgroundColor: '#ff6b6b',
  },
  typeT: {
    backgroundColor: '#51cf66',
  },
  typeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  masteryLabel: {
    color: '#888',
    fontSize: 10,
    marginRight: 4,
  },
  masteryBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  masteryCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  editBtn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#666',
    fontSize: 12,
  },
  editSection: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#ff4757',
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  addBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4facfe',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#51cf66',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#555',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  exportBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffa502',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  exportBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e3f',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  categoryPicker: {
    maxHeight: 40,
  },
  catOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#333',
  },
  catOptionActive: {
    backgroundColor: '#4facfe',
  },
  catOptionText: {
    color: '#888',
    fontSize: 12,
  },
  catOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#333',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 6,
  },
  typeSelectorBtnActive: {
    backgroundColor: '#4facfe',
  },
  typeSelectorText: {
    color: '#888',
    fontSize: 12,
  },
  typeSelectorTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  modalCancelText: {
    color: '#888',
    fontWeight: 'bold',
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#51cf66',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
