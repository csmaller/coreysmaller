<?php

/*
| Words that never make good flashcard answers. ClozeQuestionGenerator skips
| them as key terms and strips them from the start of capitalized phrases
| ("The", "In", "However"). Besides the usual function words, the list holds
| common verbs, adjectives and adverbs of 5+ letters, because the generator
| has no part-of-speech tagger and treats other 5+ letter words as nouns.
|
| Keep every entry lowercase.
*/

return [
    // Articles, pronouns, determiners
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our',
    'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'whose', 'whoever', 'whatever', 'whichever', 'each', 'every', 'either',
    'neither', 'another', 'other', 'others', 'some', 'someone', 'something', 'somebody', 'anyone', 'anything',
    'anybody', 'everyone', 'everything', 'everybody', 'nothing', 'nobody', 'none', 'such', 'both', 'all',
    'any', 'few', 'fewer', 'many', 'much', 'more', 'most', 'less', 'least', 'several', 'various', 'certain',
    'whole', 'own', 'same',

    // Prepositions and conjunctions
    'about', 'above', 'across', 'after', 'against', 'along', 'alongside', 'amid', 'among', 'amongst',
    'around', 'as', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond',
    'by', 'despite', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like', 'near',
    'of', 'off', 'on', 'onto', 'out', 'outside', 'over', 'past', 'per', 'since', 'through', 'throughout',
    'till', 'to', 'toward', 'towards', 'under', 'underneath', 'until', 'unto', 'up', 'upon', 'via', 'with',
    'within', 'without', 'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'then', 'than', 'because',
    'although', 'though', 'unless', 'whereas', 'whether', 'while', 'whilst', 'where', 'wherever', 'when',
    'whenever', 'whereby', 'wherein', 'thereby', 'therein', 'thereof', 'hence', 'thus', 'therefore',
    'however', 'moreover', 'furthermore', 'nevertheless', 'nonetheless', 'meanwhile', 'otherwise',
    'instead', 'rather', 'namely', 'including', 'regarding', 'concerning', 'following', 'according',

    // Auxiliary and very common verbs
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'done', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
    'ought', 'need', 'needs', 'become', 'becomes', 'became', 'begin', 'begins', 'began', 'begun', 'bring',
    'brings', 'brought', 'build', 'builds', 'built', 'call', 'calls', 'came', 'come', 'comes', 'consider',
    'considers', 'contain', 'contains', 'continue', 'continues', 'create', 'creates', 'describe',
    'describes', 'develop', 'develops', 'differ', 'differs', 'enable', 'enables', 'exist', 'exists',
    'follow', 'follows', 'found', 'gave', 'give', 'given', 'gives', 'goes', 'going', 'gone', 'grow', 'grows',
    'grew', 'grown', 'happen', 'happens', 'help', 'helps', 'include', 'includes', 'involve', 'involves',
    'keep', 'keeps', 'kept', 'know', 'knows', 'knew', 'known', 'lead', 'leads', 'leave', 'leaves', 'left',
    'made', 'make', 'makes', 'mean', 'means', 'meant', 'occur', 'occurs', 'produce', 'produces', 'provide',
    'provides', 'reach', 'reaches', 'refer', 'refers', 'remain', 'remains', 'require', 'requires', 'result',
    'results', 'said', 'says', 'seem', 'seems', 'shown', 'shows', 'start', 'starts', 'take', 'takes', 'taken',
    'took', 'tend', 'tends', 'think', 'thinks', 'thought', 'tried', 'tries', 'allow', 'allows', 'appear',
    'appears', 'apply', 'applies', 'argue', 'argues', 'believe', 'believes', 'cause', 'causes', 'change',
    'changes', 'choose', 'chose', 'chosen', 'remove', 'removes', 'serve', 'serves', 'suggest', 'suggests',
    'support', 'supports', 'travel', 'travels', 'write', 'writes', 'wrote', 'written', 'present', 'presents',
    'represent', 'represents', 'perform', 'performs', 'receive', 'receives', 'release', 'releases',
    'store', 'stores', 'convert', 'converts',

    // Common adjectives
    'able', 'about', 'actual', 'additional', 'available', 'basic', 'better', 'bigger', 'certain', 'clear',
    'close', 'common', 'complete', 'complex', 'current', 'different', 'difficult', 'early', 'earlier',
    'easier', 'entire', 'equal', 'every', 'final', 'first', 'former', 'full', 'general', 'great', 'greater',
    'greatest', 'high', 'higher', 'highest', 'important', 'initial', 'large', 'larger', 'largest', 'later',
    'latter', 'little', 'local', 'longer', 'lower', 'main', 'major', 'minor', 'modern', 'multiple',
    'necessary', 'needed', 'normal', 'notable', 'original', 'particular', 'possible', 'potential',
    'present', 'previous', 'primary', 'prior', 'proper', 'public', 'recent', 'related', 'relative', 'second',
    'separate', 'serious', 'short', 'similar', 'simple', 'single', 'small', 'smaller', 'smallest',
    'special', 'specific', 'standard', 'strong', 'stronger', 'sufficient', 'third', 'total', 'typical',
    'unique', 'usual', 'valid', 'whole', 'wrong', 'young', 'older', 'oldest', 'newer', 'newest', 'careful',
    'overall', 'nearly', 'often', 'other', 'together',

    // Common adverbs and fillers
    'again', 'almost', 'already', 'also', 'always', 'anyway', 'away', 'back', 'even', 'ever', 'here',
    'just', 'later', 'never', 'next', 'once', 'only', 'perhaps', 'quite', 'really', 'since', 'soon', 'still',
    'there', 'today', 'twice', 'very', 'well', 'often', 'sometimes', 'usually', 'indeed', 'actually',
    'around', 'enough', 'instead', 'maybe', 'further', 'forward', 'whose', 'which', 'among', 'about',
    'though', 'thing', 'things', 'think', 'every', 'example', 'examples', 'number', 'numbers', 'part',
    'parts', 'kind', 'kinds', 'sort', 'sorts', 'type', 'types', 'way', 'ways', 'time', 'times', 'year',
    'years', 'people', 'person', 'place', 'places', 'point', 'points', 'fact', 'case', 'cases', 'order',
    'level', 'levels', 'amount', 'amounts', 'group', 'groups', 'range', 'means', 'there', 'where',
];
