import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsYouTubeUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) return true; // Allow empty values, use @IsNotEmpty() separately if required
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
    return youtubeRegex.test(url);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid YouTube URL format';
  }
}

@ValidatorConstraint({ async: false })
export class IsSoundCloudUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) return true; // Allow empty values
    
    const soundcloudRegex = /^https:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(\?.*)?$/;
    return soundcloudRegex.test(url);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid SoundCloud URL format';
  }
}

@ValidatorConstraint({ async: false })
export class IsSlugConstraint implements ValidatorConstraintInterface {
  validate(slug: string, args: ValidationArguments) {
    if (!slug) return true; // Allow empty values
    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Slug must contain only lowercase letters, numbers, and hyphens';
  }
}

@ValidatorConstraint({ async: false })
export class IsAudioUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) return true; // Allow empty values
    
    // Check for valid audio file extensions or streaming URLs
    const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i;
    const streamingUrls = /^https:\/\/(open\.spotify\.com|music\.apple\.com|soundcloud\.com)/;
    
    try {
      const urlObj = new URL(url);
      return audioExtensions.test(urlObj.pathname) || streamingUrls.test(url);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid audio URL format or unsupported audio file type';
  }
}

// Decorator functions
export function IsYouTubeUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsYouTubeUrlConstraint,
    });
  };
}

export function IsSoundCloudUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSoundCloudUrlConstraint,
    });
  };
}

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSlugConstraint,
    });
  };
}

export function IsAudioUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAudioUrlConstraint,
    });
  };
}