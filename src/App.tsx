import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';

const ValuesTierList = () => {
  const [values, setValues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [draggedValue, setDraggedValue] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [changesMade, setChangesMade] = useState(false);
  const [lastExportTime, setLastExportTime] = useState(null);
  const [animatingValues, setAnimatingValues] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedDataset, setSelectedDataset] = useState('act-comprehensive');

  const preloadedDatasets = {
    'act-comprehensive': {
      name: 'ACT Comprehensive Values',
      data: [
        {"name":"Compassion","description":"Actively caring about others' suffering and taking steps to relieve it.","category":"Compassion & Care"},
        {"name":"Empathy","description":"Understanding and sharing another person's feelings and perspectives.","category":"Compassion & Care"},
        {"name":"Kindness","description":"Choosing to be helpful, gentle, and considerate in everyday interactions.","category":"Compassion & Care"},
        {"name":"Love","description":"Valuing the well-being of others with deep affection and commitment.","category":"Compassion & Care"},
        {"name":"Altruism","description":"Helping others at a cost to oneself without expectation of reward.","category":"Compassion & Care"},
        {"name":"Generosity","description":"Freely giving time, resources, or attention to benefit others.","category":"Compassion & Care"},
        {"name":"Hospitality","description":"Welcoming and caring for guests and strangers with warmth.","category":"Compassion & Care"},
        {"name":"Forgiveness","description":"Letting go of resentment and the desire for retaliation.","category":"Compassion & Care"},
        {"name":"Gratitude","description":"Recognizing and appreciating benefits received from people or life.","category":"Temperance, Balance & Well-being"},
        {"name":"Humility","description":"Keeping one's achievements and importance in proper perspective.","category":"Integrity & Character"},
        {"name":"Honesty","description":"Telling the truth and avoiding deception in word and deed.","category":"Integrity & Character"},
        {"name":"Integrity","description":"Aligning actions with moral principles consistently, even when hard.","category":"Integrity & Character"},
        {"name":"Trustworthiness","description":"Being reliable so others can depend on your word and actions.","category":"Integrity & Character"},
        {"name":"Responsibility","description":"Owning the consequences of one's choices and duties.","category":"Integrity & Character"},
        {"name":"Accountability","description":"Accepting evaluation and consequences for one's performance and impact.","category":"Integrity & Character"},
        {"name":"Reliability","description":"Doing what you say you will do, consistently and on time.","category":"Integrity & Character"},
        {"name":"Courage","description":"Acting rightly despite fear, risk, or social pressure.","category":"Integrity & Character"},
        {"name":"Perseverance","description":"Sustaining effort toward a goal despite obstacles or fatigue.","category":"Excellence, Work & Creativity"},
        {"name":"Resilience","description":"Recovering and adapting constructively after setbacks or stress.","category":"Temperance, Balance & Well-being"},
        {"name":"Patience","description":"Tolerating delay or difficulty without frustration or complaint.","category":"Temperance, Balance & Well-being"},
        {"name":"Self-discipline","description":"Regulating impulses to pursue long-term, meaningful aims.","category":"Temperance, Balance & Well-being"},
        {"name":"Temperance","description":"Practicing moderation and self-restraint in appetites and desires.","category":"Temperance, Balance & Well-being"},
        {"name":"Prudence","description":"Making wise, forward-looking choices with realistic risk assessment.","category":"Wisdom, Truth & Learning"},
        {"name":"Wisdom","description":"Judging well about what matters and how to live.","category":"Wisdom, Truth & Learning"},
        {"name":"Curiosity","description":"Seeking to understand, explore, and learn continuously.","category":"Wisdom, Truth & Learning"},
        {"name":"Open-mindedness","description":"Willingness to consider new evidence, ideas, and perspectives.","category":"Wisdom, Truth & Learning"},
        {"name":"Critical thinking","description":"Applying reason and evidence to evaluate claims and decisions.","category":"Wisdom, Truth & Learning"},
        {"name":"Skepticism","description":"Withholding belief until sufficient evidence justifies it.","category":"Wisdom, Truth & Learning"},
        {"name":"Rationality","description":"Using logic and proportionate evidence to guide beliefs and actions.","category":"Wisdom, Truth & Learning"},
        {"name":"Creativity","description":"Producing original, useful ideas or expressions.","category":"Excellence, Work & Creativity"},
        {"name":"Innovation","description":"Implementing new ideas to create practical value.","category":"Excellence, Work & Creativity"},
        {"name":"Learning","description":"Systematically acquiring knowledge, skills, and understanding.","category":"Wisdom, Truth & Learning"},
        {"name":"Mastery","description":"Pursuing excellence and deep competence in a craft or field.","category":"Excellence, Work & Creativity"},
        {"name":"Diligence","description":"Working carefully, consistently, and thoroughly.","category":"Excellence, Work & Creativity"},
        {"name":"Craftsmanship","description":"Taking pride in quality, detail, and durability of work.","category":"Excellence, Work & Creativity"},
        {"name":"Professionalism","description":"Upholding standards, ethics, and competence in one's role.","category":"Excellence, Work & Creativity"},
        {"name":"Work ethic","description":"Valuing honest effort and responsibility in labor.","category":"Excellence, Work & Creativity"},
        {"name":"Initiative","description":"Taking action without being prompted to improve situations.","category":"Excellence, Work & Creativity"},
        {"name":"Resourcefulness","description":"Finding clever, practical solutions with available means.","category":"Excellence, Work & Creativity"},
        {"name":"Adaptability","description":"Adjusting effectively to changing conditions and feedback.","category":"Excellence, Work & Creativity"},
        {"name":"Balance","description":"Integrating competing priorities to sustain health and purpose.","category":"Temperance, Balance & Well-being"},
        {"name":"Simplicity","description":"Favoring clarity and essentials over excess and clutter.","category":"Temperance, Balance & Well-being"},
        {"name":"Frugality","description":"Using resources carefully to avoid waste.","category":"Temperance, Balance & Well-being"},
        {"name":"Sustainability","description":"Meeting needs today without harming future generations.","category":"Environment & Stewardship"},
        {"name":"Environmental stewardship","description":"Caring for ecosystems, species, and natural resources.","category":"Environment & Stewardship"},
        {"name":"Animal welfare","description":"Valuing humane treatment and protection of animals.","category":"Environment & Stewardship"},
        {"name":"Health","description":"Prioritizing physical, mental, and social well-being.","category":"Temperance, Balance & Well-being"},
        {"name":"Safety","description":"Preventing harm and protecting people from hazards.","category":"Temperance, Balance & Well-being"},
        {"name":"Serenity","description":"Cultivating calm, equanimity, and inner peace.","category":"Temperance, Balance & Well-being"},
        {"name":"Joy","description":"Embracing delight, play, and positive affect in life.","category":"Temperance, Balance & Well-being"},
        {"name":"Humor","description":"Lightening burdens with wit and shared laughter.","category":"Temperance, Balance & Well-being"},
        {"name":"Beauty","description":"Appreciating and creating aesthetic harmony and form.","category":"Temperance, Balance & Well-being"},
        {"name":"Truth","description":"Seeking and honoring what is real and accurate.","category":"Wisdom, Truth & Learning"},
        {"name":"Justice","description":"Giving each their due and rectifying wrongs.","category":"Justice, Rights & Fairness"},
        {"name":"Fairness","description":"Applying impartial and consistent standards to all.","category":"Justice, Rights & Fairness"},
        {"name":"Equity","description":"Striving for just outcomes that address unequal starting points.","category":"Justice, Rights & Fairness"},
        {"name":"Equality","description":"Affirming equal moral worth and equal basic rights.","category":"Justice, Rights & Fairness"},
        {"name":"Freedom","description":"Valuing autonomy in thought, expression, and action.","category":"Autonomy & Freedom"},
        {"name":"Autonomy","description":"Making self-directed choices aligned with one's values.","category":"Autonomy & Freedom"},
        {"name":"Dignity","description":"Respecting the inherent worth of every person.","category":"Justice, Rights & Fairness"},
        {"name":"Privacy","description":"Protecting personal information and boundaries from intrusion.","category":"Autonomy & Freedom"},
        {"name":"Consent","description":"Ensuring voluntary, informed agreement in interactions and relationships.","category":"Autonomy & Freedom"},
        {"name":"Bodily integrity","description":"Safeguarding individuals' control over their own bodies.","category":"Autonomy & Freedom"},
        {"name":"Human rights","description":"Upholding universal claims to freedom, safety, and participation.","category":"Justice, Rights & Fairness"},
        {"name":"Solidarity","description":"Standing with others, especially the vulnerable, in mutual support.","category":"Community & Belonging"},
        {"name":"Community","description":"Building shared identity, mutual aid, and common goods.","category":"Community & Belonging"},
        {"name":"Cooperation","description":"Working together toward shared goals harmoniously.","category":"Community & Belonging"},
        {"name":"Reciprocity","description":"Returning benefits and obligations in balanced mutual exchange.","category":"Community & Belonging"},
        {"name":"Tolerance","description":"Allowing differing beliefs and practices without hostility.","category":"Community & Belonging"},
        {"name":"Inclusivity","description":"Proactively welcoming and enabling diverse participation.","category":"Community & Belonging"},
        {"name":"Diversity","description":"Valuing differences in identities, backgrounds, and viewpoints.","category":"Community & Belonging"},
        {"name":"Pluralism","description":"Supporting peaceful coexistence of multiple values and traditions.","category":"Community & Belonging"},
        {"name":"Cosmopolitanism","description":"Recognizing a shared moral community across borders.","category":"Community & Belonging"},
        {"name":"Civic virtue","description":"Contributing responsibly to public life and institutions.","category":"Justice, Rights & Fairness"},
        {"name":"Rule of law","description":"Governing by known, impartial, and enforced rules.","category":"Justice, Rights & Fairness"},
        {"name":"Democracy","description":"Valuing self-government, representation, and public deliberation.","category":"Justice, Rights & Fairness"},
        {"name":"Transparency","description":"Making decisions and information open to scrutiny.","category":"Justice, Rights & Fairness"},
        {"name":"Stewardship","description":"Managing resources and responsibilities for the long term.","category":"Environment & Stewardship"},
        {"name":"Merit","description":"Rewarding effort, skill, and results fairly.","category":"Justice, Rights & Fairness"},
        {"name":"Loyalty","description":"Standing by people, causes, or communities with fidelity.","category":"Integrity & Character"},
        {"name":"Duty","description":"Fulfilling obligations owed to others and society.","category":"Integrity & Character"},
        {"name":"Honor","description":"Maintaining moral reputation through upright conduct.","category":"Integrity & Character"},
        {"name":"Respect","description":"Treating people and norms with consideration and regard.","category":"Integrity & Character"},
        {"name":"Reverence","description":"Holding sacred things with profound respect and awe.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Spirituality","description":"Seeking meaning, connection, and transcendence beyond the self.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Awe","description":"Allowing vastness to reshape perception and values.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Empirical-mindedness","description":"Letting observations and data inform beliefs and actions.","category":"Wisdom, Truth & Learning"},
        {"name":"Scientific integrity","description":"Practicing honesty, rigor, and reproducibility in research.","category":"Wisdom, Truth & Learning"},
        {"name":"Education","description":"Valuing broad learning and cultivation of the mind.","category":"Wisdom, Truth & Learning"},
        {"name":"Scholarship","description":"Pursuing careful study and transmission of knowledge.","category":"Wisdom, Truth & Learning"},
        {"name":"Dialogue","description":"Engaging others in good-faith exchange to understand and improve.","category":"Wisdom, Truth & Learning"},
        {"name":"Nonviolence","description":"Refusing to use harm to resolve conflicts.","category":"Compassion & Care"},
        {"name":"Peace","description":"Preferring harmonious relations and just conflict resolution.","category":"Compassion & Care"},
        {"name":"Reconciliation","description":"Restoring relationships after injury through truth and repair.","category":"Justice, Rights & Fairness"},
        {"name":"Restorative justice","description":"Repairing harms by involving all affected parties.","category":"Justice, Rights & Fairness"},
        {"name":"Mercy","description":"Tempering judgment with compassion and leniency.","category":"Compassion & Care"},
        {"name":"Magnanimity","description":"Responding to offense or success with generosity of spirit.","category":"Compassion & Care"},
        {"name":"Chastity","description":"Governing sexual conduct by chosen moral commitments.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Fidelity","description":"Keeping promises and faithfulness in relationships.","category":"Integrity & Character"},
        {"name":"Parenthood","description":"Nurturing and guiding children toward flourishing.","category":"Community & Belonging"},
        {"name":"Filial piety (xiao)","description":"Honoring, supporting, and respecting parents and ancestors.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Respect for elders","description":"Valuing the wisdom and status of older community members.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Teacher respect","description":"Treating educators with deference and gratitude.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Friendship","description":"Investing in mutual care, trust, and shared growth.","category":"Community & Belonging"},
        {"name":"Good neighborliness","description":"Acting considerately toward those living nearby.","category":"Community & Belonging"},
        {"name":"Hospitality (omotenashi)","description":"Anticipating guests' needs with gracious, wholehearted care.","category":"Compassion & Care"},
        {"name":"Benevolence (ren)","description":"Cultivating humaneness and kindness toward others.","category":"Compassion & Care"},
        {"name":"Ritual propriety (li)","description":"Upholding respectful conduct and social harmony through norms.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Harmony (he)","description":"Seeking balanced, peaceful relations among people and nature.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Truthfulness (satya)","description":"Practicing honesty and authenticity in thought and speech.","category":"Integrity & Character"},
        {"name":"Non-harming (ahimsa)","description":"Avoiding injury to all beings in action and intention.","category":"Compassion & Care"},
        {"name":"Compassion (karuṇā)","description":"Extending active mercy to alleviate suffering.","category":"Compassion & Care"},
        {"name":"Duty/rightness (dharma)","description":"Fulfilling moral order and one's rightful responsibilities.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Generous giving (dāna)","description":"Sharing resources to support others and spiritual aims.","category":"Compassion & Care"},
        {"name":"Service (seva)","description":"Selfless work done for the benefit of others.","category":"Compassion & Care"},
        {"name":"God-consciousness (taqwa)","description":"Living with mindful awareness of moral accountability to God.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Justice ('adl)","description":"Establishing fairness and balance in personal and social life.","category":"Justice, Rights & Fairness"},
        {"name":"Charity (tzedakah)","description":"Obligatory generosity aimed at justice for the needy.","category":"Compassion & Care"},
        {"name":"Repairing the world (tikkun olam)","description":"Acting to mend social and environmental harms.","category":"Justice, Rights & Fairness"},
        {"name":"Sanctity of life (pikuach nefesh)","description":"Prioritizing preservation of human life above other duties.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Aloha","description":"Practicing love, compassion, and mutual respect in relationships.","category":"Community & Belonging"},
        {"name":"Kuleana","description":"Embracing personal responsibility and privilege as obligations to community.","category":"Integrity & Character"},
        {"name":"Ohana","description":"Valuing extended family bonds and mutual support.","category":"Community & Belonging"},
        {"name":"Manaakitanga","description":"Showing care, generosity, and hospitality to others.","category":"Compassion & Care"},
        {"name":"Kaitiakitanga","description":"Exercising guardianship of land, waters, and living beings.","category":"Environment & Stewardship"},
        {"name":"Whanaungatanga","description":"Building kinship through shared experience and mutual commitment.","category":"Community & Belonging"},
        {"name":"Ubuntu","description":"Affirming 'I am because we are,' emphasizing interdependence and dignity.","category":"Community & Belonging"},
        {"name":"Ujamaa","description":"Practicing cooperative economics and shared prosperity within community.","category":"Community & Belonging"},
        {"name":"Buen vivir (sumak kawsay)","description":"Pursuing collective well-being in harmony with nature.","category":"Environment & Stewardship"},
        {"name":"Pachamama reverence","description":"Respecting Mother Earth as sacred and life-giving.","category":"Environment & Stewardship"},
        {"name":"Sisu","description":"Sustained, stoic determination in the face of adversity.","category":"Integrity & Character"},
        {"name":"Lagom","description":"Seeking 'just enough' balance and moderation in life.","category":"Temperance, Balance & Well-being"},
        {"name":"Jantelagen","description":"Valuing humility and social equality over individual boasting.","category":"Integrity & Character"},
        {"name":"Hygge","description":"Cultivating cozy togetherness, contentment, and simple pleasures.","category":"Temperance, Balance & Well-being"},
        {"name":"Wabi-sabi","description":"Appreciating imperfect, impermanent, and incomplete beauty.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Ikigai","description":"Finding a personally meaningful reason to get up each day.","category":"Temperance, Balance & Well-being"},
        {"name":"Gaman","description":"Enduring hardship with patience and dignity.","category":"Integrity & Character"},
        {"name":"Bushidō honor","description":"Upholding rectitude, courage, benevolence, respect, sincerity, honor, and loyalty.","category":"Integrity & Character"},
        {"name":"Chūgi (loyalty)","description":"Maintaining faithful devotion to duties and relationships.","category":"Integrity & Character"},
        {"name":"Makoto (sincerity)","description":"Acting with genuine heart and truthful intent.","category":"Integrity & Character"},
        {"name":"Omoluàbí","description":"Embodying good character, respect, and integrity in Yoruba culture.","category":"Integrity & Character"},
        {"name":"Sankofa","description":"Looking back to retrieve wisdom to move forward wisely.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Harambee","description":"Pulling together collectively for shared progress.","category":"Community & Belonging"},
        {"name":"Bayanihan","description":"Practicing communal cooperation and mutual aid.","category":"Community & Belonging"},
        {"name":"Pakikipagkapwa","description":"Recognizing shared personhood and relational responsibility.","category":"Community & Belonging"},
        {"name":"Jeong","description":"Nurturing deep, enduring affectionate bonds within community.","category":"Community & Belonging"},
        {"name":"Nunchi","description":"Perceptive social attunement to others' moods and needs.","category":"Community & Belonging"},
        {"name":"Renqing","description":"Maintaining reciprocity and human feelings in relationships.","category":"Community & Belonging"},
        {"name":"Guanxi care","description":"Valuing networks of mutual obligation and trust.","category":"Community & Belonging"},
        {"name":"Confianza","description":"Building interpersonal trust through reliability and goodwill.","category":"Community & Belonging"},
        {"name":"Sobremesa","description":"Savoring post-meal conversation to deepen relationships.","category":"Community & Belonging"},
        {"name":"Duende","description":"Embracing soulful intensity and authenticity in expression.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Querencia","description":"Cherishing a place or state that fosters one's strength.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Pura vida","description":"Celebrating simple, grateful, laid-back enjoyment of life.","category":"Temperance, Balance & Well-being"},
        {"name":"Meraki","description":"Putting one's soul and creativity into one's work.","category":"Excellence, Work & Creativity"},
        {"name":"Arete","description":"Striving for excellence and virtue in all endeavors.","category":"Excellence, Work & Creativity"},
        {"name":"Eudaimonia","description":"Seeking human flourishing through virtuous activity over a lifetime.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Pietas","description":"Fulfilling devotion to family, gods, and country with duty.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Philotimo","description":"Acting honorably with generosity, pride, and social responsibility.","category":"Integrity & Character"},
        {"name":"Modesty","description":"Avoiding self-aggrandizement and ostentation in behavior and dress.","category":"Integrity & Character"},
        {"name":"Cleanliness","description":"Valuing hygiene and order as respect for self and others.","category":"Temperance, Balance & Well-being"},
        {"name":"Punctuality","description":"Honoring others' time by being timely and dependable.","category":"Excellence, Work & Creativity"},
        {"name":"Thrift","description":"Conserving money and goods to steward resources well.","category":"Temperance, Balance & Well-being"},
        {"name":"Enterprise","description":"Embracing initiative and risk to create new value.","category":"Excellence, Work & Creativity"},
        {"name":"Prosperity with ethics","description":"Seeking wealth while honoring moral constraints and fairness.","category":"Excellence, Work & Creativity"},
        {"name":"Social mobility","description":"Valuing opportunities to advance through merit and effort.","category":"Justice, Rights & Fairness"},
        {"name":"Lifelong friendship","description":"Sustaining loyal, supportive relationships over time.","category":"Community & Belonging"},
        {"name":"Mentorship","description":"Guiding others' growth with wisdom and care.","category":"Excellence, Work & Creativity"},
        {"name":"Scholarship generosity","description":"Sharing knowledge freely for collective benefit.","category":"Wisdom, Truth & Learning"},
        {"name":"Global responsibility","description":"Considering worldwide impacts of local choices.","category":"Environment & Stewardship"},
        {"name":"Intergenerational equity","description":"Ensuring future generations inherit viable options.","category":"Environment & Stewardship"},
        {"name":"Cultural preservation","description":"Respecting and sustaining languages, arts, and traditions.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Free expression","description":"Protecting the right to speak, create, and dissent.","category":"Autonomy & Freedom"},
        {"name":"Intellectual humility","description":"Revising beliefs when better evidence appears.","category":"Wisdom, Truth & Learning"},
        {"name":"Evidence-based policy","description":"Grounding public decisions in data and rigorous evaluation.","category":"Wisdom, Truth & Learning"},
        {"name":"Deliberation","description":"Weighing reasons together to reach better collective judgments.","category":"Wisdom, Truth & Learning"},
        {"name":"Proportionality","description":"Matching responses and punishments to the gravity of acts.","category":"Justice, Rights & Fairness"},
        {"name":"Subsidiarity","description":"Handling matters at the most local competent level.","category":"Justice, Rights & Fairness"},
        {"name":"Mutual aid","description":"Voluntarily meeting needs through community networks.","category":"Community & Belonging"},
        {"name":"Care ethics","description":"Prioritizing relationships, dependence, and responsive care.","category":"Compassion & Care"},
        {"name":"Play","description":"Valuing exploration, games, and creativity for learning and joy.","category":"Temperance, Balance & Well-being"},
        {"name":"Adventure","description":"Embracing exploration, novelty, and courageous discovery.","category":"Temperance, Balance & Well-being"},
        {"name":"Reverence for ancestors","description":"Honoring forebears' memory and obligations to lineage.","category":"Tradition, Spirituality & Reverence"},
        {"name":"Good governance","description":"Expecting competent, ethical, and service-oriented leadership.","category":"Justice, Rights & Fairness"},
        {"name":"Service leadership","description":"Leading by empowering and serving others' growth.","category":"Excellence, Work & Creativity"},
        {"name":"Environmental justice","description":"Ensuring fair distribution of environmental benefits and burdens.","category":"Environment & Stewardship"},
        {"name":"Digital privacy","description":"Protecting autonomy and rights in the information age.","category":"Autonomy & Freedom"},
        {"name":"Data stewardship","description":"Managing data responsibly for consent, security, and benefit.","category":"Autonomy & Freedom"},
        {"name":"Accessibility","description":"Designing environments so all people can participate fully.","category":"Justice, Rights & Fairness"},
        {"name":"Compassionate competence","description":"Pairing technical excellence with humane concern.","category":"Excellence, Work & Creativity"}
      ]
    }
  };

  const tiers = [
    { id: 'very-important', label: 'Very Important to Me', color: 'bg-emerald-50 border-emerald-200', icon: '💎' },
    { id: 'somewhat-important', label: 'Somewhat Important to Me', color: 'bg-blue-50 border-blue-200', icon: '⭐' },
    { id: 'not-important', label: 'Not Important to Me', color: 'bg-gray-50 border-gray-200', icon: '○' }
  ];

  const tierKeys = {
    '1': 'very-important',
    '2': 'somewhat-important',
    '3': 'not-important'
  };

  // Load default dataset on mount
  React.useEffect(() => {
    if (values.length === 0) {
      loadDataset('act-comprehensive');
    }
  }, []);

  const loadDataset = (datasetKey) => {
    const dataset = preloadedDatasets[datasetKey];
    if (dataset) {
      const importedValues = dataset.data.map((item, idx) => ({
        id: item.id || `value-${idx}`,
        value: item.value || item.name || '',
        description: item.description || '',
        category: item.category || 'Uncategorized',
        location: item.location || item.category || 'Uncategorized'
      }));

      const uniqueCategories = [...new Set(importedValues.map(v => v.category))];
      
      setValues(importedValues);
      setCategories(uniqueCategories);
      setSelectedDataset(datasetKey);
      setChangesMade(false);
      setLastExportTime(null);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(values, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `act-values-rankings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setLastExportTime(new Date());
      setChangesMade(false);
      alert('Progress exported successfully!');
    } catch (error) {
      alert('Failed to export: ' + error.message);
    }
  };

  // Track mouse position
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update hover after value positions change
  const updateHoverFromMousePosition = () => {
    setTimeout(() => {
      const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (element) {
        const valueElement = element.closest('[data-value-id]');
        if (valueElement) {
          const valueId = valueElement.getAttribute('data-value-id');
          const value = values.find(v => v.id === valueId);
          if (value) {
            setHoveredValue(value);
          }
        }
      }
    }, 50);
  };

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (hoveredValue && (tierKeys[e.key] || e.key === '4')) {
        let targetLocation;
        
        if (e.key === '4') {
          targetLocation = hoveredValue.category;
        } else {
          targetLocation = tierKeys[e.key];
        }
        
        if (hoveredValue.location !== targetLocation) {
          setValues(prev => prev.map(v => 
            v.id === hoveredValue.id ? { ...v, location: targetLocation } : v
          ));
          setChangesMade(true);
          
          const valueId = hoveredValue.id;
          setAnimatingValues(prev => new Set(prev).add(valueId));
          setTimeout(() => {
            setAnimatingValues(prev => {
              const newSet = new Set(prev);
              newSet.delete(valueId);
              return newSet;
            });
          }, 500);
          
          setHoveredValue(null);
          updateHoverFromMousePosition();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hoveredValue, mousePosition, values]);

  const handleDragStart = (e, value) => {
    setDraggedValue(value);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newLocation) => {
    e.preventDefault();
    if (draggedValue && draggedValue.location !== newLocation) {
      setValues(prev => prev.map(v => 
        v.id === draggedValue.id ? { ...v, location: newLocation } : v
      ));
      setChangesMade(true);
    }
    setDraggedValue(null);
  };

  const handleCategoryDragStart = (e, category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedCategory && draggedCategory !== targetCategory) {
      const draggedIndex = categories.indexOf(draggedCategory);
      const targetIndex = categories.indexOf(targetCategory);
      
      const newCategories = [...categories];
      newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);
      
      setCategories(newCategories);
      setChangesMade(true);
    }
    setDraggedCategory(null);
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getValuesByLocation = (location) => {
    return values.filter(v => v.location === location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ACT Values Tier List</h1>
              <p className="text-gray-600 mt-1">Drag values to rank them, or hover and press 1, 2, 3 (tiers) or 4 (categories)</p>
            </div>
            <div className="flex gap-3 items-center">
              <select
                value={selectedDataset}
                onChange={(e) => loadDataset(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(preloadedDatasets).map(([key, dataset]) => (
                  <option key={key} value={key}>
                    {dataset.name} ({dataset.data.length} values)
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                <Download size={20} />
                Export Progress
              </button>
              <button
                onClick={() => loadDataset(selectedDataset)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={tier.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.id)}
                className={`${tier.color} border-2 rounded-lg p-4 min-h-32`}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>{tier.icon}</span>
                  {tier.label}
                  <span className="text-sm font-normal text-gray-600">
                    ({getValuesByLocation(tier.id).length})
                  </span>
                  <span className="ml-auto text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300 text-gray-600">
                    Press {index + 1}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {getValuesByLocation(tier.id).map(value => (
                    <div
                      key={value.id}
                      data-value-id={value.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, value)}
                      onMouseEnter={() => setHoveredValue(value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      className={`relative px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-move hover:shadow-md hover:border-gray-400 transition-all select-none ${
                        animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-800 block">{value.value || value.name || 'Unnamed Value'}</span>
                      {hoveredValue?.id === value.id && value.description && (
                        <div className="absolute z-10 bottom-full left-0 mb-2 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                          <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                          {value.description}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-between">
                <span>Value Categories</span>
                <span className="text-xs font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-300 text-emerald-700">
                  Press 4
                </span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">Drag values to the tiers to rank them</p>
              
              <div className="space-y-2">
                {categories.map(category => {
                  const categoryValues = getValuesByLocation(category);
                  const isCollapsed = collapsedCategories[category];
                  const isDragging = draggedCategory === category;
                  
                  return (
                    <div 
                      key={category} 
                      className={`border rounded-lg ${isDragging ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleCategoryDragStart(e, category)}
                      onDragOver={handleCategoryDragOver}
                      onDrop={(e) => handleCategoryDrop(e, category)}
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          <span className="cursor-move text-gray-400">⋮⋮</span>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          {category}
                          <span className="text-sm font-normal text-gray-500">
                            ({categoryValues.length})
                          </span>
                        </span>
                      </button>
                      
                      {!isCollapsed && (
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, category)}
                          className="p-3 pt-0 flex flex-wrap gap-2"
                        >
                          {categoryValues.map(value => (
                            <div
                              key={value.id}
                              data-value-id={value.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, value)}
                              onMouseEnter={() => setHoveredValue(value)}
                              onMouseLeave={() => setHoveredValue(null)}
                              className={`relative px-3 py-2 bg-gray-50 border border-gray-300 rounded cursor-move hover:bg-white hover:shadow-md transition-all text-sm select-none ${
                                animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                              }`}
                            >
                              <span className="text-gray-800 font-medium">{value.value || value.name || 'Unnamed Value'}</span>
                              {hoveredValue?.id === value.id && value.description && (
                                <div className="absolute z-10 left-full ml-2 top-0 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                                  <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                                  {value.description}
                                  <div className="absolute right-full top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuesTierList;